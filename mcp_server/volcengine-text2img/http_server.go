package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/sirupsen/logrus"
)

func StartHTTPServer(mcpServer *mcp.Server, port string) error {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	mcpHandler := mcp.NewStreamableHTTPHandler(
		func(r *http.Request) *mcp.Server {
			return mcpServer
		},
		nil,
	)

	router.Any("/mcp", gin.WrapH(mcpHandler))
	router.Any("/mcp/*path", gin.WrapH(mcpHandler))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 静态文件服务 - 提供生成的图片和视频访问
	router.Static("/images", "./generated_images")
	router.Static("/videos", "./generated_videos")

	server := &http.Server{
		Addr:    port,
		Handler: router,
	}

	go func() {
		logrus.Infof("HTTP 服务器启动在: %s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("HTTP 服务器启动失败: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("正在关闭服务器...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logrus.Warnf("服务器关闭超时: %v", err)
		return err
	}

	logrus.Info("服务器已优雅关闭")
	return nil
}
