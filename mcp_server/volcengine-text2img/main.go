package main

import (
	"context"
	"flag"
	"os"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/sirupsen/logrus"
)

func main() {
	mode := flag.String("mode", "stdio", "运行模式: stdio 或 http")
	port := flag.String("port", ":8080", "HTTP 模式的端口")
	flag.Parse()

	logrus.SetLevel(logrus.InfoLevel)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	service := NewVolcEngineService()
	server := InitMCPServer(service)

	if *mode == "stdio" {
		logrus.Info("启动 stdio 模式的 MCP 服务器...")
		transport := &mcp.StdioTransport{}
		if err := server.Run(context.Background(), transport); err != nil {
			logrus.Fatalf("stdio 模式启动失败: %v", err)
		}
	} else {
		logrus.Infof("启动 HTTP 模式的 MCP 服务器，端口: %s", *port)
		if err := StartHTTPServer(server, *port); err != nil {
			logrus.Fatalf("HTTP 模式启动失败: %v", err)
			os.Exit(1)
		}
	}
}
