# Print your target

`Print your target` is a Visual Studio Code extension for quickly adding and removing log statements in JavaScript, TypeScript, and Go files. Now powered by **AST analysis** for intelligent and precise code insertion.

## ✨ New in v0.1.0 - AST-Powered Intelligence

### 🚀 Major Improvements
- **AST-Based Analysis**: Uses TypeScript compiler API for accurate code understanding
- **Smart Expression Detection**: Intelligently identifies variables, functions, objects, and complex expressions  
- **Context-Aware Insertion**: Finds optimal insertion points based on code structure
- **Robust Log Removal**: Precisely locates and removes log statements without false positives

## 功能 Features

### 添加日志语句 Add Log Statements
- **智能分析**: AST-powered analysis understands your code context
- **自适应日志类型**: Automatically selects appropriate console methods:
  - `console.error()` for error-related variables
  - `console.info()` for async operations  
  - `console.debug()` for function calls
  - `console.warn()` for conditional expressions
  - `console.log()` for general variables
- **精确插入**: Inserts at syntactically correct locations
- **复杂表达式支持**: Handles complex expressions with object destructuring format

### 删除日志语句 Remove Log Statements  
- **AST精确匹配**: Uses AST analysis to find exact log statements
- **批量删除**: Removes multiple log statements efficiently
- **无误删**: Avoids removing non-log code that might match patterns

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

## 使用方法 Usage

### Basic Usage
1. 打开一个 JavaScript、TypeScript 或 Go 文件
2. 选中需要打印的变量或表达式 (或将光标放在变量上)
3. 使用快捷键或命令面板运行命令

### Smart Examples

```javascript
// Select 'user.name' -> Generates:
console.log('user.name value:', user.name);

// Select 'calculateScore(data)' -> Generates:  
console.debug('calculateScore() result:', calculateScore(data));

// Select 'await response.json()' -> Generates:
console.info('response.json() result:', await response.json());

// Select 'error' (error keyword) -> Generates:
console.error('error:', error);

// Complex expression -> Generates:
console.log('users.filter() result:', { users: users.filter(u => u.isActive) });
```

## 开发与构建

### 构建扩展
运行以下命令以构建扩展：
```bash
pnpm run build:package
```
