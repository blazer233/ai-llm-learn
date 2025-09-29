package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"time"
)

// Todo 结构体定义一个待办事项
type Todo struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Completed   bool      `json:"completed"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TodoList 结构体管理所有待办事项
type TodoList struct {
	Todos    []Todo `json:"todos"`
	NextID   int    `json:"next_id"`
	filename string
}

// NewTodoList 创建一个新的TodoList实例
func NewTodoList(filename string) *TodoList {
	tl := &TodoList{
		Todos:    make([]Todo, 0),
		NextID:   1,
		filename: filename,
	}
	tl.LoadFromFile()
	return tl
}

// AddTodo 添加新的待办事项
func (tl *TodoList) AddTodo(title, description string) {
	todo := Todo{
		ID:          tl.NextID,
		Title:       title,
		Description: description,
		Completed:   false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	tl.Todos = append(tl.Todos, todo)
	tl.NextID++
	tl.SaveToFile()

	fmt.Printf("✅ 成功添加任务: %s\n", title)
}

// ListTodos 显示所有待办事项
func (tl *TodoList) ListTodos() {
	if len(tl.Todos) == 0 {
		fmt.Println("📝 暂无待办事项")
		return
	}

	fmt.Println("\n📋 待办事项列表:")
	fmt.Println("================")

	for _, todo := range tl.Todos {
		status := "❌"
		if todo.Completed {
			status = "✅"
		}

		fmt.Printf("%s [ID:%d] %s\n", status, todo.ID, todo.Title)
		if todo.Description != "" {
			fmt.Printf("   描述: %s\n", todo.Description)
		}
		fmt.Printf("   创建时间: %s\n", todo.CreatedAt.Format("2006-01-02 15:04:05"))
		fmt.Println("   ----------------")
	}
}

// CompleteTodo 标记任务为完成
func (tl *TodoList) CompleteTodo(id int) {
	for i := range tl.Todos {
		if tl.Todos[i].ID == id {
			tl.Todos[i].Completed = true
			tl.Todos[i].UpdatedAt = time.Now()
			tl.SaveToFile()
			fmt.Printf("✅ 任务 '%s' 已标记为完成\n", tl.Todos[i].Title)
			return
		}
	}
	fmt.Printf("❌ 未找到ID为 %d 的任务\n", id)
}

// DeleteTodo 删除指定的待办事项
func (tl *TodoList) DeleteTodo(id int) {
	for i, todo := range tl.Todos {
		if todo.ID == id {
			// 删除元素
			tl.Todos = append(tl.Todos[:i], tl.Todos[i+1:]...)
			tl.SaveToFile()
			fmt.Printf("🗑️  成功删除任务: %s\n", todo.Title)
			return
		}
	}
	fmt.Printf("❌ 未找到ID为 %d 的任务\n", id)
}

// SaveToFile 将待办事项保存到文件
func (tl *TodoList) SaveToFile() {
	data, err := json.MarshalIndent(tl, "", "  ")
	if err != nil {
		fmt.Printf("❌ 保存文件时出错: %v\n", err)
		return
	}

	err = ioutil.WriteFile(tl.filename, data, 0644)
	if err != nil {
		fmt.Printf("❌ 写入文件时出错: %v\n", err)
	}
}

// LoadFromFile 从文件加载待办事项
func (tl *TodoList) LoadFromFile() {
	if _, err := os.Stat(tl.filename); os.IsNotExist(err) {
		// 文件不存在，使用默认值
		return
	}

	data, err := ioutil.ReadFile(tl.filename)
	if err != nil {
		fmt.Printf("❌ 读取文件时出错: %v\n", err)
		return
	}

	err = json.Unmarshal(data, tl)
	if err != nil {
		fmt.Printf("❌ 解析文件时出错: %v\n", err)
	}
}

// GetStats 获取统计信息
func (tl *TodoList) GetStats() {
	total := len(tl.Todos)
	completed := 0

	for _, todo := range tl.Todos {
		if todo.Completed {
			completed++
		}
	}

	pending := total - completed

	fmt.Println("\n📊 统计信息:")
	fmt.Printf("总任务数: %d\n", total)
	fmt.Printf("已完成: %d\n", completed)
	fmt.Printf("待完成: %d\n", pending)

	if total > 0 {
		percentage := float64(completed) / float64(total) * 100
		fmt.Printf("完成率: %.1f%%\n", percentage)
	}
}
