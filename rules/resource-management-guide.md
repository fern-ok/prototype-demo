# 资源指南

适用于资源的新增、整理、替换与维护。

## 📁 资源范围

- `src/docs/assets/`：文档配图等附属资源
- `src/docs/templates/`：文档模板
- `src/database/`：页面可直接消费的数据表
- `src/themes/`：主题及其配套资源

## ✅ 管理规则

- 先检查是否已有可复用资源，再决定是否新增
- 资源按类型放回对应目录，不混放
- 命名保持清晰，并与同类资源风格一致
- 未经用户确认，不删除、不覆盖已有资源
- 引用使用稳定相对路径，避免临时路径或外部临时链接
- 数据资源遵循 `src/database/README.md`
- 主题资源按 `src/themes/<theme-key>/` 维护，并同步相关说明

## 🔗 相关规则

- `rules/theme-guide.md`
- `src/database/README.md`
