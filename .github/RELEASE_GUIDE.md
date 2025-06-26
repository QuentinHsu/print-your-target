# Automated Release Workflow / 自动发布工作流程

This project is configured with two GitHub Actions workflows to automate the version release process:
这个项目配置了两个 GitHub Actions 工作流程来自动化版本发布流程：

## Workflow Description / 工作流程说明

### 1. Version Check (`version-check.yml`)

- **Trigger / 触发时机**: When creating or updating a Pull Request to the `main` branch / 当创建或更新 Pull Request 到 `main` 分支时
- **Function / 功能**: Check if the PR modifies the `version` field in `package.json` / 检查 PR 是否修改了 `package.json` 中的 `version` 字段
- **Behavior / 行为**: Add comments to the PR explaining whether a release will be triggered / 在 PR 中添加评论，说明是否会触发发布

### 2. Release (`release.yml`)

- **Trigger / 触发时机**: When a Pull Request is merged into the `main` branch / 当 Pull Request 合并到 `main` 分支时
- **Condition / 条件**: Only executes when the `version` field in `package.json` has changed / 只有当 `package.json` 中的 `version` 字段发生变化时才会执行
- **Functions / 功能**:
  - Automatically build VS Code extension / 自动构建 VS Code 扩展
  - Create GitHub Release / 创建 GitHub Release
  - Upload `.vsix` file as Release asset / 上传 `.vsix` 文件作为 Release 资产

## How to Release a New Version / 如何发布新版本

1. **Create a feature branch / 创建功能分支**

   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make code changes / 进行代码更改**

   - Implement your feature or fix / 实现你的功能或修复

3. **Update version number / 更新版本号**

   - Edit the `package.json` file / 编辑 `package.json` 文件
   - Modify the `version` field, e.g., from `"0.0.3"` to `"0.0.4"` / 修改 `version` 字段，例如从 `"0.0.3"` 改为 `"0.0.4"`

   ```json
   {
     "name": "print-your-target",
     "version": "0.0.4"
     // ... other fields / 其他字段
   }
   ```

4. **Create Pull Request and write changelog / 创建 Pull Request 并编写更新日志**

   ```bash
   git add .
   git commit -m "feat: add new feature and bump version to 0.0.4"
   git push origin feature/your-feature
   ```

   When creating a PR on GitHub, please add a `## Changelog` section in the PR description:
   在 GitHub 上创建 PR 时，请在 PR 描述中添加 `## Changelog` 部分：

   ```markdown
   ## Changelog

   ### Added / 新增

   - Added batch file copy functionality / 新增批量文件复制功能
   - Support for custom keyboard shortcuts / 支持自定义快捷键

   ### Fixed / 修复

   - Fixed path issues on Windows systems / 修复 Windows 系统下的路径问题
   - Fixed handling of special characters in filenames / 修复特殊字符文件名的处理

   ### Changed / 变更

   - Optimized right-click menu display logic / 优化右键菜单的显示逻辑
   ```

5. **Check version and changelog status / 检查版本和更新日志状态**

   - Version Check workflow will run automatically / Version Check 工作流程会自动运行
   - If version is updated and includes changelog, it will show "🚀 Release will be triggered!" / 如果版本已更新且包含更新日志，会显示 "🚀 Release will be triggered!"
   - If version is updated but lacks changelog, it will provide guidance for adding changelog / 如果版本已更新但缺少更新日志，会提供添加更新日志的指导
   - If version is not updated, it will show "📝 No release will be triggered" / 如果版本未更新，会显示 "📝 No release will be triggered"

6. **Merge PR / 合并 PR**
   - When the PR is merged into the `main` branch / 当 PR 被合并到 `main` 分支时
   - If version is updated, the Release workflow will run automatically / 如果版本已更新，Release 工作流程会自动运行
   - Automatically update the `CHANGELOG.md` file / 自动更新 `CHANGELOG.md` 文件
   - Create a GitHub Release with the extracted changelog content / 创建 GitHub Release，包含提取的更新日志内容

## Changelog Format Specification / 更新日志格式规范

### Basic Format / 基本格式

Add a `## Changelog` section to the PR description using the following format:
在 PR 描述中添加 `## Changelog` 部分，使用以下格式：

```markdown
## Changelog

### Added / 新增功能

- Description of new features / 描述新增的功能

### Fixed / Bug 修复

- Description of fixed issues / 描述修复的问题

### Changed / 功能变更

- Description of changed features / 描述变更的功能

### Removed / 移除功能

- Description of removed features / 描述移除的功能

### Security / 安全相关

- Description of security-related changes / 描述安全相关的更改
```

### Example / 示例

```markdown
## Changelog

### Added / 新增

- Added batch file copy functionality with multi-file selection support
- 新增批量文件复制功能，支持一次选择多个文件
- Added keyboard shortcut `Ctrl+Shift+C` for quick file name copying
- 新增键盘快捷键 `Ctrl+Shift+C` 快速复制文件名
- Support for copying complete file paths
- 支持复制文件的完整路径

### Fixed / 修复

- Fixed file path separator display error on Windows systems
- 修复在 Windows 系统下文件路径分隔符显示错误的问题
- Fixed copy failure when filename contains special characters
- 修复文件名包含特殊字符时复制失败的 Bug
- Fixed right-click menu display issues with certain themes
- 修复右键菜单在某些主题下显示异常的问题

### Changed / 变更

- Optimized right-click menu display logic to show relevant options only for appropriate file types
- 优化右键菜单的显示逻辑，只在适当的文件类型上显示相关选项
- Improved error messages to be more user-friendly
- 改进错误提示信息，使其更加用户友好

### Removed / 移除

- Removed experimental file preview feature (will be redesigned in next version)
- 移除了实验性的文件预览功能（将在下个版本重新设计）
```

### Automated Processing / 自动化处理

- 🤖 **Automatic Extraction / 自动提取**: Workflow automatically extracts the `## Changelog` section from PR description / 工作流程会自动从 PR 描述中提取 `## Changelog` 部分
- 📝 **Automatic Update / 自动更新**: Automatically updates `CHANGELOG.md` file when PR is merged / 合并 PR 时会自动更新 `CHANGELOG.md` 文件
- 🚀 **Automatic Release / 自动发布**: Changelog will be included in GitHub Release / 更新日志会被包含在 GitHub Release 中
- 💬 **Smart Prompts / 智能提示**: If changelog is missing, guidance will be provided in the PR / 如果缺少更新日志，会在 PR 中提供添加指导

## Version Number Specification / 版本号规范

It is recommended to follow [Semantic Versioning](https://semver.org/) specification:
建议遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **Major version / 主版本号**: When you make incompatible API changes / 当你做了不兼容的 API 修改
- **Minor version / 次版本号**: When you add functionality in a backwards compatible manner / 当你做了向下兼容的功能性新增
- **Patch version / 修订号**: When you make backwards compatible bug fixes / 当你做了向下兼容的问题修正

Examples / 例如：

- `0.0.4` → `0.0.5` (bug fixes / 修复 bug)
- `0.0.4` → `0.1.0` (new features / 新增功能)
- `0.1.0` → `1.0.0` (breaking changes / 重大更改)

## Notes / 注意事项

1. **Must update version number / 必须更新版本号**: Release is only triggered when the `version` field in `package.json` changes / 只有当 `package.json` 中的 `version` 字段发生变化时，才会触发发布
2. **Recommended to write changelog / 推荐编写更新日志**: Although not mandatory, it is strongly recommended to add changelog in PR description / 虽然不是必须的，但强烈建议在 PR 描述中添加更新日志
3. **Automatic file updates / 自动文件更新**: `CHANGELOG.md` file will be automatically updated and committed to the repository when PR is merged / 合并 PR 时会自动更新 `CHANGELOG.md` 文件并提交到仓库
4. **One version per PR / 一次只能发布一个版本**: Each PR should only contain one version number change / 每个 PR 只应该包含一次版本号的更改
5. **Version numbers cannot be downgraded / 版本号不能回退**: New version number should always be greater than the current version / 新版本号应该总是比当前版本号大
6. **Build failure handling / 构建失败处理**: If build fails, Release will not be created. Need to fix issues and retrigger / 如果构建失败，Release 不会被创建，需要修复问题后重新触发

## 📁 File Structure Description / 文件结构说明

The workflow will create and update the following files:
工作流程会创建和更新以下文件：

- **`CHANGELOG.md`**: Automatically maintained changelog file / 自动维护的更新日志文件
- **`.github/workflows/version-check.yml`**: PR check workflow / PR 检查工作流程
- **`.github/workflows/release.yml`**: Automated release workflow / 自动发布工作流程
- **`.github/pull_request_template.md`**: PR template with changelog guidance / PR 模板，包含更新日志指导
- **`.github/ISSUE_TEMPLATE/`**: Issue templates for collecting bug reports and feature requests / Issue 模板，用于收集 Bug 报告和功能请求

## 🔧 Advanced Features / 高级功能

### Manual CHANGELOG.md Updates / 手动更新 CHANGELOG.md

If you need to manually edit the changelog:
如果需要手动编辑更新日志：

1. Edit the `CHANGELOG.md` file directly / 直接编辑 `CHANGELOG.md` 文件
2. Follow the existing format to add new version entries / 遵循现有格式添加新版本条目
3. Commit the changes / 提交更改

### Skip Automatic Changelog / 跳过自动更新日志

If the PR description contains `[skip changelog]`, the workflow will skip automatic changelog extraction.
如果 PR 描述中包含 `[skip changelog]`，工作流程将跳过自动更新日志提取。

### Pre-release Versions / 预发布版本

Modifying the version number to include pre-release identifiers (such as `1.0.0-beta.1`) will create a pre-release Release.
修改版本号为包含预发布标识符（如 `1.0.0-beta.1`）将创建预发布 Release。

## 手动触发发布

如果需要手动触发发布（不推荐），可以：

1. 直接在 `main` 分支上更新版本号
2. 或者修改 `release.yml` 添加 `workflow_dispatch` 触发器

```yaml
on:
  pull_request:
    types: [closed]
    branches: [main]
  workflow_dispatch: # 添加这行以支持手动触发
```
