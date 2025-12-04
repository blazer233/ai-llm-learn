package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

type VolcEngineService struct {
	apiKey         string
	endpoint       string
	imageDir       string
	videoDir       string
	queryThrottle  map[string]time.Time // 任务ID -> 上次查询时间
	throttleMutex  sync.Mutex           // 保护queryThrottle的互斥锁
}

func NewVolcEngineService() *VolcEngineService {
	imageDir := filepath.Join(".", "generated_images")
	videoDir := filepath.Join(".", "generated_videos")
	os.MkdirAll(imageDir, 0755)
	os.MkdirAll(videoDir, 0755)

	return &VolcEngineService{
		apiKey:        os.Getenv("VOLCENGINE_API_KEY"),
		endpoint:      "https://ark.cn-beijing.volces.com/api/v3",
		imageDir:      imageDir,
		videoDir:      videoDir,
		queryThrottle: make(map[string]time.Time),
	}
}

func (s *VolcEngineService) GenerateImage(ctx context.Context, args Text2ImgArgs) (string, error) {
	if s.apiKey == "" {
		return "", fmt.Errorf("请设置环境变量 VOLCENGINE_API_KEY")
	}

	size := fmt.Sprintf("%dx%d", args.Width, args.Height)
	reqBody := map[string]interface{}{
		"model":           "doubao-seedream-4-0-250828",
		"prompt":          args.Prompt,
		"n":               1,
		"size":            size,
		"response_format": "b64_json",
		"watermark":       false,
	}

	if args.Seed != 0 {
		reqBody["seed"] = args.Seed
	}

	if args.Watermark != nil {
		reqBody["watermark"] = *args.Watermark
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("序列化请求失败: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.endpoint+"/images/generations", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	logrus.Infof("发起文生图请求: %s (尺寸: %s)", args.Prompt, size)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API 返回错误 (状态码 %d): %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Data []struct {
			B64JSON string `json:"b64_json"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("解析响应失败: %w", err)
	}

	if len(result.Data) == 0 || result.Data[0].B64JSON == "" {
		return "", fmt.Errorf("API 未返回图像数据")
	}

	imageData, err := base64.StdEncoding.DecodeString(result.Data[0].B64JSON)
	if err != nil {
		return "", fmt.Errorf("解码图像数据失败: %w", err)
	}

	filename := fmt.Sprintf("img_%d.png", time.Now().Unix())
	imagePath := filepath.Join(s.imageDir, filename)

	if err := os.WriteFile(imagePath, imageData, 0644); err != nil {
		return "", fmt.Errorf("保存图片失败: %w", err)
	}

	imageURL := fmt.Sprintf("http://localhost:8080/images/%s", filename)
	absPath, _ := filepath.Abs(imagePath)
	logrus.Infof("图像生成成功，保存至: %s (大小: %d bytes), URL: %s", absPath, len(imageData), imageURL)

	return imageURL, nil
}

func (s *VolcEngineService) CreateVideoTask(ctx context.Context, args Text2VideoArgs) (string, error) {
	if s.apiKey == "" {
		return "", fmt.Errorf("请设置环境变量 VOLCENGINE_API_KEY")
	}

	content := []map[string]interface{}{
		{
			"type": "text",
			"text": args.Prompt,
		},
	}

	parameters := map[string]interface{}{}
	if args.Width != 0 {
		parameters["width"] = args.Width
	}
	if args.Height != 0 {
		parameters["height"] = args.Height
	}
	if args.Duration != 0 {
		parameters["duration"] = args.Duration
	}
	if args.Seed != 0 {
		parameters["seed"] = args.Seed
	}

	reqBody := map[string]interface{}{
		"model":   "doubao-seedance-1-0-pro-250528",
		"content": content,
	}

	if len(parameters) > 0 {
		reqBody["parameters"] = parameters
	}

	if args.NegativePrompt != "" {
		reqBody["negative_prompt"] = args.NegativePrompt
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("序列化请求失败: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.endpoint+"/contents/generations/tasks", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	logrus.Infof("发起视频生成请求: %s (尺寸: %dx%d, 时长: %ds)", args.Prompt, args.Width, args.Height, args.Duration)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API 返回错误 (状态码 %d): %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ID string `json:"id"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("解析响应失败: %w", err)
	}

	if result.ID == "" {
		return "", fmt.Errorf("API 未返回任务ID")
	}

	logrus.Infof("视频生成任务创建成功，任务ID: %s", result.ID)
	return result.ID, nil
}

func (s *VolcEngineService) QueryVideoTask(ctx context.Context, taskID string) (map[string]interface{}, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("请设置环境变量 VOLCENGINE_API_KEY")
	}

	// 检查查询频率限制
	s.throttleMutex.Lock()
	if lastQuery, exists := s.queryThrottle[taskID]; exists {
		timeSinceLastQuery := time.Since(lastQuery)
		minInterval := 15 * time.Second // 最小查询间隔15秒
		
		if timeSinceLastQuery < minInterval {
			s.throttleMutex.Unlock()
			waitTime := minInterval - timeSinceLastQuery
			return map[string]interface{}{
				"status":        "throttled",
				"task_id":       taskID,
				"wait_seconds":  int(waitTime.Seconds()),
				"last_query_at": lastQuery.Unix(),
			}, nil
		}
	}
	// 更新查询时间
	s.queryThrottle[taskID] = time.Now()
	s.throttleMutex.Unlock()

	req, err := http.NewRequestWithContext(ctx, "GET", s.endpoint+"/contents/generations/tasks/"+taskID, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API 返回错误 (状态码 %d): %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ID               string `json:"id"`
		Model            string `json:"model"`
		Status           string `json:"status"`
		Content          struct {
			VideoURL string `json:"video_url"`
		} `json:"content"`
		Seed             int    `json:"seed"`
		Resolution       string `json:"resolution"`
		Ratio            string `json:"ratio"`
		Duration         int    `json:"duration"`
		FramesPerSecond  int    `json:"framespersecond"`
		CreatedAt        int64  `json:"created_at"`
		UpdatedAt        int64  `json:"updated_at"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	taskInfo := map[string]interface{}{
		"task_id":    result.ID,
		"status":     result.Status,
		"model":      result.Model,
		"created_at": result.CreatedAt,
		"updated_at": result.UpdatedAt,
		"resolution": result.Resolution,
		"ratio":      result.Ratio,
		"duration":   result.Duration,
		"fps":        result.FramesPerSecond,
		"seed":       result.Seed,
	}

	// 视频URL在content.video_url字段
	if result.Content.VideoURL != "" {
		taskInfo["video_urls"] = []string{result.Content.VideoURL}
		taskInfo["video_url"] = result.Content.VideoURL
	}

	logrus.Infof("查询任务 %s，状态: %s", taskID, result.Status)
	return taskInfo, nil
}

func (s *VolcEngineService) CreateAndWaitVideoTask(ctx context.Context, args Text2VideoArgs) (string, error) {
	// 创建任务
	taskID, err := s.CreateVideoTask(ctx, args)
	if err != nil {
		return "", err
	}

	logrus.Infof("开始轮询任务 %s，等待视频生成完成...", taskID)

	// 轮询任务状态，最多等待10分钟
	maxAttempts := 120 // 10分钟 = 120次 * 5秒
	pollInterval := 5 * time.Second

	for i := 0; i < maxAttempts; i++ {
		select {
		case <-ctx.Done():
			return "", fmt.Errorf("任务被取消")
		case <-time.After(pollInterval):
			taskInfo, err := s.QueryVideoTask(ctx, taskID)
			if err != nil {
				logrus.Warnf("查询任务失败: %v，继续重试...", err)
				continue
			}

			status := taskInfo["status"].(string)
			logrus.Infof("任务 %s 状态: %s (第 %d/%d 次查询)", taskID, status, i+1, maxAttempts)

			switch status {
			case "completed", "succeeded":
				// 任务成功完成
				if videoURLs, ok := taskInfo["video_urls"].([]string); ok && len(videoURLs) > 0 {
					videoURL := videoURLs[0]
					logrus.Infof("视频生成成功！URL: %s", videoURL)
					return videoURL, nil
				}
				return "", fmt.Errorf("任务完成但未获取到视频URL")

			case "failed":
				return "", fmt.Errorf("视频生成失败，任务ID: %s", taskID)

			case "canceled", "cancelled":
				return "", fmt.Errorf("任务已被取消，任务ID: %s", taskID)

			case "pending", "running":
				// 继续等待
				continue

			default:
				logrus.Warnf("未知的任务状态: %s", status)
				continue
			}
		}
	}

	return "", fmt.Errorf("任务超时：等待10分钟后仍未完成，任务ID: %s", taskID)
}
