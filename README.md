# Print your target

`Print your target` 是一个 Visual Studio Code 扩展，用于在 JavaScript、TypeScript 和 Go 文件中快速添加或删除日志语句，帮助开发者更高效地调试代码。

## 功能

### 添加日志语句
- 在选中的变量或文本后插入日志语句。
- 根据文件类型自动生成适合的日志语句：
  - JavaScript/TypeScript: 使用 `console.log` 或 `console.error`。
  - Go: 使用 `log.Printf`。

### 删除日志语句
- 根据配置删除指定类型的日志语句：
  - JavaScript/TypeScript: 支持删除 `console.log`、`console.error` 等。
  - Go: 支持删除 `log.Printf`。

## 快捷键

- **添加日志语句**:  
  - Windows/Linux: `Ctrl+Shift+L`  
  - macOS: `Cmd+Shift+L`
- **删除日志语句**:  
  - Windows/Linux: `Ctrl+Shift+D`  
  - macOS: `Cmd+Shift+D`

## 配置项

扩展提供了以下配置项，用户可以根据需要自定义：

### 错误关键字
- `printYourTarget.errorKeywords.javascript`: 定义 JavaScript/TypeScript 中的错误关键字，默认值为 `["error", "err", "e"]`。
- `printYourTarget.errorKeywords.go`: 定义 Go 中的错误关键字，默认值为 `["err", "error"]`。

### 日志类型
- `printYourTarget.deleteLogType.javascript`: 定义 JavaScript/TypeScript 中需要删除的日志类型，默认值为 `["log"]`。
- `printYourTarget.deleteLogType.go`: 定义 Go 中需要删除的日志类型，默认值为 `["Printf"]`。

## 安装

1. 从 [Print your target - Visual Studio Marketplace](https://marketplace.visualstudio.com/items/?itemName=QuentinHsu.print-your-target) 安装扩展。
2. 或者下载 `.vsix` 文件并通过 VS Code 的扩展管理器手动安装。

## 使用方法

1. 打开一个 JavaScript、TypeScript 或 Go 文件。
2. 选中需要打印的变量或文本。
3. 使用快捷键或命令面板运行以下命令：
   - `Add Log Statement`: 添加日志语句。
   - `Delete Log Statements`: 删除日志语句。

## 开发与构建

### 构建扩展
运行以下命令以构建扩展：
```bash
pnpm run build:package
```
