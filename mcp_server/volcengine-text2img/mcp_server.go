package main

import (
	"context"
	"fmt"
	"runtime/debug"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/sirupsen/logrus"
)

type Text2ImgArgs struct {
	Prompt    string `json:"prompt" jsonschema:"图像描述文本(必填)"`
	Width     int    `json:"width,omitempty" jsonschema:"图像宽度，默认1024，支持: 1024, 720, 1280"`
	Height    int    `json:"height,omitempty" jsonschema:"图像高度，默认1024，支持: 1024, 720, 1280"`
	Seed      int64  `json:"seed,omitempty" jsonschema:"随机种子，用于复现结果(可选)"`
	Watermark *bool  `json:"watermark,omitempty" jsonschema:"是否添加水印，默认false(不添加)"`
}

type Text2VideoArgs struct {
	Prompt         string `json:"prompt" jsonschema:"视频描述文本(必填)"`
	NegativePrompt string `json:"negative_prompt,omitempty" jsonschema:"负面提示词，排除不希望出现的元素(可选)"`
	Width          int    `json:"width,omitempty" jsonschema:"视频宽度，默认1024"`
	Height         int    `json:"height,omitempty" jsonschema:"视频高度，默认576"`
	Duration       int    `json:"duration,omitempty" jsonschema:"视频时长(秒)，默认5"`
	Seed           int64  `json:"seed,omitempty" jsonschema:"随机种子，用于复现结果(可选)"`
}

type QueryTaskArgs struct {
	TaskID string `json:"task_id" jsonschema:"视频生成任务ID(必填)"`
}

func InitMCPServer(service *VolcEngineService) *mcp.Server {
	server := mcp.NewServer(
		&mcp.Implementation{
			Name:    "volcengine-multimedia",
			Version: "1.0.0",
		},
		nil,
	)

	mcp.AddTool(server,
		&mcp.Tool{
			Name:        "generate_image",
			Description: "使用火山引擎API根据文本描述生成图像",
		},
		withPanicRecovery("generate_image", func(ctx context.Context, req *mcp.CallToolRequest, args Text2ImgArgs) (*mcp.CallToolResult, any, error) {
			if args.Width == 0 {
				args.Width = 1024
			}
			if args.Height == 0 {
				args.Height = 1024
			}

			imagePath, err := service.GenerateImage(ctx, args)
			if err != nil {
				return &mcp.CallToolResult{
					Content: []mcp.Content{
						&mcp.TextContent{Text: fmt.Sprintf("生成图像失败: %v", err)},
					},
					IsError: true,
				}, nil, nil
			}

			return &mcp.CallToolResult{
				Content: []mcp.Content{
					&mcp.TextContent{Text: fmt.Sprintf("✅ 图像生成成功！\n\n📝 提示词: %s\n📐 尺寸: %dx%d\n🔗 图片URL: %s", args.Prompt, args.Width, args.Height, imagePath)},
				},
			}, nil, nil
		}),
	)

	mcp.AddTool(server,
		&mcp.Tool{
			Name:        "generate_video",
			Description: "使用火山引擎API根据文本描述生成视频（创建任务并返回任务ID，需手动使用query_video_task轮询结果）",
		},
		withPanicRecovery("generate_video", func(ctx context.Context, req *mcp.CallToolRequest, args Text2VideoArgs) (*mcp.CallToolResult, any, error) {
			if args.Width == 0 {
				args.Width = 1024
			}
			if args.Height == 0 {
				args.Height = 576
			}
			if args.Duration == 0 {
				args.Duration = 5
			}

			// 只创建任务，避免MCP客户端超时
			taskID, err := service.CreateVideoTask(ctx, args)
			if err != nil {
				return &mcp.CallToolResult{
					Content: []mcp.Content{
						&mcp.TextContent{Text: fmt.Sprintf("创建视频任务失败: %v", err)},
					},
					IsError: true,
				}, nil, nil
			}

			return &mcp.CallToolResult{
				Content: []mcp.Content{
					&mcp.TextContent{Text: fmt.Sprintf("✅ 视频生成任务已创建！\n\n📝 提示词: %s\n📐 尺寸: %dx%d\n⏱️  时长: %ds\n🆔 任务ID: %s\n\n⏳ 视频生成通常需要 2-5 分钟\n💡 请每隔30秒使用 query_video_task 工具查询一次，参数: {\"task_id\": \"%s\"}", args.Prompt, args.Width, args.Height, args.Duration, taskID, taskID)},
				},
			}, nil, nil
		}),
	)

	mcp.AddTool(server,
		&mcp.Tool{
			Name:        "create_video_task",
			Description: "创建视频生成任务（仅创建任务，返回任务ID，不等待完成）",
		},
		withPanicRecovery("create_video_task", func(ctx context.Context, req *mcp.CallToolRequest, args Text2VideoArgs) (*mcp.CallToolResult, any, error) {
			if args.Width == 0 {
				args.Width = 1024
			}
			if args.Height == 0 {
				args.Height = 576
			}
			if args.Duration == 0 {
				args.Duration = 5
			}

			taskID, err := service.CreateVideoTask(ctx, args)
			if err != nil {
				return &mcp.CallToolResult{
					Content: []mcp.Content{
						&mcp.TextContent{Text: fmt.Sprintf("创建视频任务失败: %v", err)},
					},
					IsError: true,
				}, nil, nil
			}

			return &mcp.CallToolResult{
				Content: []mcp.Content{
					&mcp.TextContent{Text: fmt.Sprintf("✅ 视频生成任务创建成功！\n\n📝 提示词: %s\n📐 尺寸: %dx%d\n⏱️  时长: %ds\n🆔 任务ID: %s\n\n💡 使用 query_video_task 查询状态，或使用 generate_video 自动等待完成", args.Prompt, args.Width, args.Height, args.Duration, taskID)},
				},
			}, nil, nil
		}),
	)

	mcp.AddTool(server,
		&mcp.Tool{
			Name:        "query_video_task",
			Description: "查询视频生成任务状态和结果",
		},
		withPanicRecovery("query_video_task", func(ctx context.Context, req *mcp.CallToolRequest, args QueryTaskArgs) (*mcp.CallToolResult, any, error) {
			taskInfo, err := service.QueryVideoTask(ctx, args.TaskID)
			if err != nil {
				return &mcp.CallToolResult{
					Content: []mcp.Content{
						&mcp.TextContent{Text: fmt.Sprintf("查询任务失败: %v", err)},
					},
					IsError: true,
				}, nil, nil
			}

		status := taskInfo["status"].(string)
		
		// 处理频率限制
		if status == "throttled" {
			waitSeconds := 15
			if ws, ok := taskInfo["wait_seconds"].(int); ok {
				waitSeconds = ws
			}
			message := fmt.Sprintf("🚫 查询过于频繁\n\n🆔 任务ID: %s\n⏱️  请等待 %d 秒后再查询\n\n💡 为了避免服务器压力，同一任务查询间隔不能少于15秒", 
				args.TaskID, waitSeconds)
			return &mcp.CallToolResult{
				Content: []mcp.Content{
					&mcp.TextContent{Text: message},
				},
			}, nil, nil
		}
		
		// 计算任务已运行时间
		var elapsedTime int64
		if createdAt, ok := taskInfo["created_at"].(int64); ok {
			elapsedTime = time.Now().Unix() - createdAt
		}

		switch status {
		case "pending", "running":
			// 计算建议的下次查询时间
			var waitSeconds int
			if elapsedTime < 60 {
				// 前1分钟：建议等待30秒
				waitSeconds = 30
			} else if elapsedTime < 180 {
				// 1-3分钟：建议等待20秒
				waitSeconds = 20
			} else {
				// 3分钟以上：建议等待15秒
				waitSeconds = 15
			}
			
			message := fmt.Sprintf("⏳ 任务处理中...\n\n🆔 任务ID: %s\n📊 状态: %s\n⏱️  已运行: %d秒\n\n💡 视频生成通常需要2-5分钟\n\n⚠️  重要提示：\n- 请勿立即重复查询\n- 建议等待 %d 秒后再次查询\n- 频繁请求不会加快生成速度\n- 下次查询时间：%d秒后", 
				args.TaskID, status, elapsedTime, waitSeconds, waitSeconds)
			return &mcp.CallToolResult{
				Content: []mcp.Content{
					&mcp.TextContent{Text: message},
				},
			}, nil, nil
			
		case "completed", "succeeded":
			if videoURL, ok := taskInfo["video_url"].(string); ok && videoURL != "" {
				// 获取额外信息
				resolution := ""
				ratio := ""
				duration := 0
				fps := 0
				if r, ok := taskInfo["resolution"].(string); ok {
					resolution = r
				}
				if ra, ok := taskInfo["ratio"].(string); ok {
					ratio = ra
				}
				if d, ok := taskInfo["duration"].(int); ok {
					duration = d
				}
				if f, ok := taskInfo["fps"].(int); ok {
					fps = f
				}
				
				message := fmt.Sprintf("✅ 视频生成成功！\n\n🆔 任务ID: %s\n📊 状态: %s\n🎬 视频链接: %s\n📐 分辨率: %s\n📏 比例: %s\n⏱️  时长: %ds\n🎞️  帧率: %dfps", 
					args.TaskID, status, videoURL, resolution, ratio, duration, fps)
				
				return &mcp.CallToolResult{
					Content: []mcp.Content{
						&mcp.TextContent{Text: message},
					},
				}, nil, nil
			} else {
				message := fmt.Sprintf("✅ 任务完成，但未获取到视频链接\n\n🆔 任务ID: %s", args.TaskID)
				return &mcp.CallToolResult{
					Content: []mcp.Content{
						&mcp.TextContent{Text: message},
					},
				}, nil, nil
			}
			
		case "failed":
			message := fmt.Sprintf("❌ 任务失败\n\n🆔 任务ID: %s\n📊 状态: %s", args.TaskID, status)
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: message},
			},
		}, nil, nil
		
	default:
		message := fmt.Sprintf("📊 任务状态: %s\n\n🆔 任务ID: %s", status, args.TaskID)
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: message},
			},
		}, nil, nil
	}
	}),
)

	logrus.Info("MCP Server 初始化完成，已注册 4 个工具")
	return server
}

func withPanicRecovery[T any](
	toolName string,
	handler func(context.Context, *mcp.CallToolRequest, T) (*mcp.CallToolResult, any, error),
) func(context.Context, *mcp.CallToolRequest, T) (*mcp.CallToolResult, any, error) {
	return func(ctx context.Context, req *mcp.CallToolRequest, args T) (result *mcp.CallToolResult, resp any, err error) {
		defer func() {
			if r := recover(); r != nil {
				logrus.WithFields(logrus.Fields{
					"tool":  toolName,
					"panic": r,
				}).Error("工具处理器发生 panic")
				logrus.Errorf("Stack trace:\n%s", debug.Stack())

				result = &mcp.CallToolResult{
					Content: []mcp.Content{
						&mcp.TextContent{
							Text: fmt.Sprintf("工具 %s 执行时发生内部错误: %v", toolName, r),
						},
					},
					IsError: true,
				}
				resp = nil
				err = nil
			}
		}()

		return handler(ctx, req, args)
	}
}
