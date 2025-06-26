# Change Log

## [0.0.5] - 2025-06-26

### Fixed / 修复
- 错误类型的匹配规则异常

## [0.0.4] - 2025-06-26

### Refactor / 重构
- 重构了 console 语句的插入逻辑

## [0.0.3] - 2025-04-23

### Features

- feat: lower the minimum supported version of VSCode
- feat: add CHANGELOG generation and commit step in release workflow
- feat: add templates for changelog entries in release workflow

## [0.0.2] - 2025-04-16

### Features

- feat: enhance log statement insertion and deletion logic for JavaScript and Go

  ```javascript
  function logMessage({ message, lineBreak = false }) {
    console.log(message);
  }
  ```

## [0.0.1] - 2025-04-10

### Features

- Initial release of the `print-your-target` package.
- The basic functions have been implemented.
