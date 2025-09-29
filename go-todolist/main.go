package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func main() {
	// 创建TodoList实例，数据保存在todos.json文件中
	todoList := NewTodoList("todos.json")

	fmt.Println("🎯 欢迎使用Go TodoList!")
	fmt.Println("这是一个简单的命令行待办事项管理工具")

	// 创建输入扫描器
	scanner := bufio.NewScanner(os.Stdin)
	for {
		showMenu()
		fmt.Print("请选择操作 (1-6): ")

		if !scanner.Scan() {
			break
		}

		choice := strings.TrimSpace(scanner.Text())

		switch choice {
		case "1":
			addTodoInteractive(todoList, scanner)
		case "2":
			todoList.ListTodos()
		case "3":
			completeTodoInteractive(todoList, scanner)
		case "4":
			deleteTodoInteractive(todoList, scanner)
		case "5":
			todoList.GetStats()
		case "6":
			fmt.Println("👋 再见！感谢使用Go TodoList!")
			return
		default:
			fmt.Println("❌ 无效选择，请输入1-6之间的数字")
		}

		fmt.Println("\n按回车键继续...")
		scanner.Scan()
	}
}

// showMenu 显示主菜单
func showMenu() {
	fmt.Println("\n" + strings.Repeat("=", 30))
	fmt.Println("📋 TodoList 主菜单")
	fmt.Println(strings.Repeat("=", 30))
	fmt.Println("1. ➕ 添加新任务")
	fmt.Println("2. 📝 查看所有任务")
	fmt.Println("3. ✅ 标记任务完成")
	fmt.Println("4. 🗑️  删除任务")
	fmt.Println("5. 📊 查看统计信息")
	fmt.Println("6. 🚪 退出程序")
	fmt.Println(strings.Repeat("=", 30))
}

// addTodoInteractive 交互式添加待办事项
func addTodoInteractive(todoList *TodoList, scanner *bufio.Scanner) {
	fmt.Print("请输入任务标题: ")
	if !scanner.Scan() {
		return
	}
	title := strings.TrimSpace(scanner.Text())

	if title == "" {
		fmt.Println("❌ 任务标题不能为空")
		return
	}

	fmt.Print("请输入任务描述 (可选，直接回车跳过): ")
	if !scanner.Scan() {
		return
	}
	description := strings.TrimSpace(scanner.Text())

	todoList.AddTodo(title, description)
}

// completeTodoInteractive 交互式完成待办事项
func completeTodoInteractive(todoList *TodoList, scanner *bufio.Scanner) {
	if len(todoList.Todos) == 0 {
		fmt.Println("❌ 暂无待办事项")
		return
	}

	// 显示未完成的任务
	fmt.Println("\n未完成的任务:")
	hasIncomplete := false
	for _, todo := range todoList.Todos {
		if !todo.Completed {
			fmt.Printf("[ID:%d] %s\n", todo.ID, todo.Title)
			hasIncomplete = true
		}
	}

	if !hasIncomplete {
		fmt.Println("🎉 所有任务都已完成！")
		return
	}

	fmt.Print("请输入要完成的任务ID: ")
	if !scanner.Scan() {
		return
	}

	idStr := strings.TrimSpace(scanner.Text())
	id, err := strconv.Atoi(idStr)
	if err != nil {
		fmt.Println("❌ 请输入有效的数字ID")
		return
	}

	todoList.CompleteTodo(id)
}

// deleteTodoInteractive 交互式删除待办事项
func deleteTodoInteractive(todoList *TodoList, scanner *bufio.Scanner) {
	if len(todoList.Todos) == 0 {
		fmt.Println("❌ 暂无待办事项")
		return
	}

	// 显示所有任务
	fmt.Println("\n所有任务:")
	for _, todo := range todoList.Todos {
		status := "❌"
		if todo.Completed {
			status = "✅"
		}
		fmt.Printf("%s [ID:%d] %s\n", status, todo.ID, todo.Title)
	}

	fmt.Print("请输入要删除的任务ID: ")
	if !scanner.Scan() {
		return
	}

	idStr := strings.TrimSpace(scanner.Text())
	id, err := strconv.Atoi(idStr)
	if err != nil {
		fmt.Println("❌ 请输入有效的数字ID")
		return
	}

	// 确认删除
	fmt.Printf("确定要删除任务ID %d 吗？(y/N): ", id)
	if !scanner.Scan() {
		return
	}

	confirm := strings.ToLower(strings.TrimSpace(scanner.Text()))
	if confirm == "y" || confirm == "yes" {
		todoList.DeleteTodo(id)
	} else {
		fmt.Println("❌ 取消删除操作")
	}
}
