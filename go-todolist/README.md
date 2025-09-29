# Go TodoList - Go语言学习项目

这是一个使用Go语言实现的简单命令行待办事项管理工具，非常适合Go语言初学者学习。

## 🎯 项目特点

- **简单易懂**: 代码结构清晰，注释详细
- **功能完整**: 包含增删改查等基本功能
- **数据持久化**: 自动保存到JSON文件
- **交互友好**: 清晰的命令行界面
- **Go语言特性**: 展示了结构体、方法、JSON处理等Go语言核心概念

## 🚀 功能列表

- ➕ 添加新任务
- 📝 查看所有任务
- ✅ 标记任务完成
- 🗑️ 删除任务
- 📊 查看统计信息
- 💾 自动数据保存

## 📁 项目结构

```
go-todolist/
├── go.mod          # Go模块文件
├── main.go         # 主程序入口和用户交互
├── todo.go         # 核心业务逻辑
├── README.md       # 项目说明
└── todos.json      # 数据存储文件（运行后自动生成）
```

## 🛠️ 如何运行

1. **确保已安装Go语言环境** (版本1.21或更高)

2. **进入项目目录**:
   ```bash
   cd go-todolist
   ```

3. **运行程序**:
   ```bash
   go run .
   ```

4. **或者编译后运行**:
   ```bash
   go build -o todolist
   ./todolist
   ```

## 📚 学习要点

通过这个项目，你可以学习到以下Go语言概念：

### 1. 基础语法
- 变量声明和类型
- 函数定义和调用
- 控制流程（if/else, for, switch）

### 2. 结构体和方法
```go
type Todo struct {
    ID          int       `json:"id"`
    Title       string    `json:"title"`
    Completed   bool      `json:"completed"`
    CreatedAt   time.Time `json:"created_at"`
}

func (tl *TodoList) AddTodo(title, description string) {
    // 方法实现
}
```

### 3. 切片操作
```go
// 添加元素
tl.Todos = append(tl.Todos, todo)

// 删除元素
tl.Todos = append(tl.Todos[:i], tl.Todos[i+1:]...)
```

### 4. JSON处理
```go
// 序列化
data, err := json.MarshalIndent(tl, "", "  ")

// 反序列化
err = json.Unmarshal(data, tl)
```

### 5. 文件操作
```go
// 写文件
err = ioutil.WriteFile(filename, data, 0644)

// 读文件
data, err := ioutil.ReadFile(filename)
```

### 6. 错误处理
```go
if err != nil {
    fmt.Printf("❌ 出错了: %v\n", err)
    return
}
```

### 7. 用户输入处理
```go
scanner := bufio.NewScanner(os.Stdin)
if scanner.Scan() {
    input := strings.TrimSpace(scanner.Text())
}
```

## 🎮 使用示例

```
🎯 欢迎使用Go TodoList!
这是一个简单的命令行待办事项管理工具

==============================
📋 TodoList 主菜单
==============================
1. ➕ 添加新任务
2. 📝 查看所有任务
3. ✅ 标记任务完成
4. 🗑️ 删除任务
5. 📊 查看统计信息
6. 🚪 退出程序
==============================
请选择操作 (1-6): 1

请输入任务标题: 学习Go语言
请输入任务描述 (可选，直接回车跳过): 完成TodoList项目
✅ 成功添加任务: 学习Go语言
```

## 🔧 扩展建议

学会基本功能后，你可以尝试添加以下功能来进一步学习：

1. **任务优先级**: 为任务添加优先级字段
2. **任务分类**: 添加分类或标签功能
3. **截止日期**: 为任务设置截止时间
4. **搜索功能**: 按关键词搜索任务
5. **导出功能**: 导出为CSV或其他格式
6. **命令行参数**: 支持直接通过命令行参数操作

## 📖 Go语言学习资源

- [Go官方教程](https://tour.golang.org/)
- [Go语言圣经](https://gopl-zh.github.io/)
- [Go by Example](https://gobyexample.com/)

## 🤝 贡献

这是一个学习项目，欢迎提出改进建议！

---

**祝你Go语言学习愉快！** 🎉