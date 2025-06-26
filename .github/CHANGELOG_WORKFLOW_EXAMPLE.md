# Changelog Workflow Usage Example / 更新日志工作流程使用示例

> ⚠️ **IMPORTANT / 重要提示**: This is an EXAMPLE document only. The content below is for demonstration purposes and should NOT be used in actual PRs.
>
> ⚠️ **重要**: 这仅是一个示例文档。以下内容仅用于演示，不应在实际的 PR 中使用。

## Example Scenario: Adding New Feature and Releasing Version 0.0.4

## 示例场景：添加新功能并发布版本 0.0.4

### 1. Create feature branch / 创建功能分支

```bash
git checkout -b feature/batch-copy
```

### 2. Implement feature / 实现功能

- Add batch copy functionality / 添加批量复制功能
- Update related files / 更新相关文件

### 3. Update version number / 更新版本号

Edit `package.json` / 编辑 `package.json`:

```json
{
  "name": "print-your-target",
  "version": "0.0.4" // Changed from 0.0.3 to 0.0.4 / 从 0.0.3 改为 0.0.4
  // ...
}
```

### 4. Commit and push / 提交并推送

```bash
git add .
git commit -m "feat: add batch copy functionality and bump version to 0.0.4"
git push origin feature/batch-copy
```

### 5. Create PR / 创建 PR

Create a PR on GitHub with the following description:
在 GitHub 上创建 PR，使用以下描述：

> ⚠️ **EXAMPLE ONLY / 仅为示例**: The content below is for demonstration. Do NOT copy this to real PRs.
>
> ⚠️ **仅为示例**: 以下内容仅用于演示，请勿复制到真实的 PR 中。

```markdown
## Description / 描述

This PR adds batch file copy functionality, allowing users to select multiple files for copy operations at once.
这个 PR 添加了批量文件复制功能，允许用户一次选择多个文件进行复制操作。

## Type of Change / 更改类型

- [x] ✨ New feature / 新功能 (feat)

## Changelog

### Added / 新增

- Added batch file copy functionality with multi-file selection support
- 新增批量文件复制功能，支持同时选择多个文件
- Added keyboard shortcut `Ctrl+Shift+C` for quick batch copying
- 新增快捷键 `Ctrl+Shift+C` 用于快速批量复制
- Added progress indicator showing batch operation progress
- 新增进度提示，显示批量操作的进度

### Fixed / 修复

- Fixed performance issues when selecting large numbers of files
- 修复在选择大量文件时的性能问题
- Fixed handling errors for filenames with special characters
- 修复某些文件名包含特殊字符时的处理错误

### Changed / 变更

- Optimized right-click menu layout with grouped batch operation options
- 优化右键菜单的布局，将批量操作选项分组显示
- Improved error messages with more detailed failure reasons
- 改进错误提示，提供更详细的失败原因

## Testing / 测试

- [x] Local testing passed / 本地测试通过
- [x] Tested single-file and multi-file copy scenarios / 测试了单文件和多文件复制场景
- [x] Tested on both Windows and macOS / 在 Windows 和 macOS 上都进行了测试
```

### 6. Automatic check results / 自动检查结果

After the Version Check workflow runs, it will automatically add a comment to the PR:
Version Check 工作流程运行后，会在 PR 中自动添加评论：

```
🚀 Release will be triggered! / 🚀 将触发发布！

Version will change from `0.0.3` to `0.0.4` when this PR is merged.
当此 PR 合并时，版本将从 `0.0.3` 更改为 `0.0.4`。

📝 Changelog detected: / 📝 检测到更新日志：
```

### Added / 新增

- Added batch file copy functionality with multi-file selection support
- 新增批量文件复制功能，支持同时选择多个文件
- Added keyboard shortcut `Ctrl+Shift+C` for quick batch copying
- 新增快捷键 `Ctrl+Shift+C` 用于快速批量复制
- Added progress indicator showing batch operation progress
- 新增进度提示，显示批量操作的进度

### Fixed / 修复

- Fixed performance issues when selecting large numbers of files
- 修复在选择大量文件时的性能问题
- Fixed handling errors for filenames with special characters
- 修复某些文件名包含特殊字符时的处理错误

### Changed / 变更

- Optimized right-click menu layout with grouped batch operation options
- 优化右键菜单的布局，将批量操作选项分组显示
- Improved error messages with more detailed failure reasons
- 改进错误提示，提供更详细的失败原因

```

A new release will be automatically created with tag `v0.0.4` including the above changelog.
将自动创建一个新的发布版本，标签为 `v0.0.4`，包含上述更新日志。
```

### 7. Merge PR / 合并 PR

When the PR is merged, the Release workflow will: / 当 PR 被合并后，Release 工作流程会：

1. ✅ Detect version change from 0.0.3 to 0.0.4 / 检测到版本从 0.0.3 变更为 0.0.4
2. 📝 Extract changelog content / 提取更新日志内容
3. 📚 Automatically update `CHANGELOG.md` file / 自动更新 `CHANGELOG.md` 文件
4. 🏗️ Build extension package / 构建扩展包
5. 🚀 Create GitHub Release v0.0.4, including: / 创建 GitHub Release v0.0.4，包含：
   - Built `.vsix` file / 构建的 `.vsix` 文件
   - Complete changelog content / 完整的更新日志内容
   - Automatically generated Git tag / 自动生成的 Git tag

### 8. Final result / 最终结果

- **GitHub Release**: v0.0.4 version containing changelog and `.vsix` file / 包含更新日志和 `.vsix` 文件的 v0.0.4 版本
- **Updated CHANGELOG.md**: Automatically added new version entry / 自动添加新版本条目
- **Git Tag**: v0.0.4 tag pointing to the merge commit / v0.0.4 标签指向合并提交

## What happens if you forget to write the changelog? / 如果忘记写更新日志会怎样？

If you forget to add changelog in the PR description when creating the PR, Version Check will prompt:
如果创建 PR 时忘记在描述中添加更新日志，Version Check 会提示：

````
🚀 Release will be triggered! / 🚀 将触发发布！

Version will change from `0.0.3` to `0.0.4` when this PR is merged.
当此 PR 合并时，版本将从 `0.0.3` 更改为 `0.0.4`。

⚠️ No changelog detected in PR description. Consider adding a `## Changelog` section to document your changes.
⚠️ 在 PR 描述中未检测到更新日志。建议添加 `## Changelog` 部分来记录您的更改。

How to add changelog: / 如何添加更新日志：
1. Edit this PR description / 编辑此 PR 描述
2. Add a section like this: / 添加如下部分：
```markdown
## Changelog

### Added / 新增
- New feature description / 新功能描述

### Fixed / 修复
- Bug fix description / Bug 修复描述

### Changed / 变更
- Change description / 变更描述
````

A new release will be automatically created with tag `v0.0.4`.
将自动创建一个新的发布版本，标签为 `v0.0.4`。

```

Even without providing a changelog, the release will still proceed, but it will use default release notes.
即使没有提供更新日志，发布仍然会进行，但会使用默认的发布说明。
```
