# 主题设计规范 / Theme Design MD

> 本文档定义了当前主题的设计价值、能力边界与使用指南，帮助开发者和 AI 正确理解和应用该设计系统。
> 这是基于 [Google Stitch Design MD](https://stitch.withgoogle.com/docs/design-md/overview/) 格式规范的最佳实践。

## 设计系统概述

<!-- 简述品牌定位、核心价值与设计原则 -->
### 品牌定位
<!-- 描述该主题想要传达的情感与专业印象 -->

### 核心价值
<!-- 列出 3-4 个核心的设计价值主张 -->
1. **可用性** - 
2. **一致性** - 
3. **品牌感** - 

### 设计原则
<!-- 具体的指导性设计原则 -->
| 原则 | 含义 |
|------|------|
| **原则名** | 原则解释 |

---

## 能力边界

### 适合的场景
<!-- 列出该主题适合的业务场景，如 ToB 后台、C 端电商等 -->
- 

### 不适合的场景
<!-- 列出该主题不适合的场景，帮助系统避免错误应用 -->
- 

---

## 色彩系统 (Colors)

### 品牌色 (Primary)
| 变量 | 色值 | 用途 |
|------|------|------|
| `--primary` | `#000000` | 主按钮、品牌强调元素 |
| `--primary-foreground` | `#FFFFFF` | 主色背景上的文字 |

### 背景色 (Background)
| 变量 | 色值 | 用途 |
|------|------|------|
| `--background` | `#FFFFFF` | 页面主背景 |
| `--card` | `#FFFFFF` | 卡片与主要区块背景 |
| `--muted` | `#F1F5F9` | 次级/禁用背景 |

### 文本色 (Text)
| 变量 | 色值 | 用途 |
|------|------|------|
| `--foreground` | `#0F172A` | 主要正文 |
| `--muted-foreground` | `#64748B` | 次要/辅助正文 |

### 边框色 (Border)
| 变量 | 色值 | 用途 |
|------|------|------|
| `--border` | `#E2E8F0` | 基础边框 |

### 语义色 (Semantic)
| 变量 | 色值 | 用途 |
|------|------|------|
| `--destructive` | `#EF4444` | 危险操作、报错提示 |

---

## 字体系统 (Typography)

### 字体族
| 用途 | 字体 | CSS 变量 |
|------|------|---------|
| 主字体 | Inter, sans-serif | `--font-sans` |
| 等宽字体 | Fira Code, monospace | `--font-mono` |

### 文本层级
| 名称 | 字号 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| H1 | 30px | 600 | 1.25 | 页面主标题 |
| H2 | 24px | 600 | 1.3 | 区块标题 |
| Body | 14px | 400 | 1.5 | 默认正文 |
| Label | 14px | 500 | 1 | 按钮、表单标签 |

---

## 间距系统 (Spacing)

<!-- 定义布局的节奏，例如 4px 网格系统 -->
| Token | 值 | 用途 |
|-------|-----|------|
| `--spacing-2` | 8px | 紧凑元素内间距 |
| `--spacing-4` | 16px | 标准间距/组件边界 |
| `--spacing-6` | 24px | 区块间隔 |
| `--spacing-8` | 32px | 大型区块间隔 |

---

## 圆角与阴影 (Radii & Shadows)

### 圆角 (Radius)
| Token | 值 | 用途 |
|------|------|------|
| `--radius-sm` | 4px | 小标签、Checkbox |
| `--radius-md` | 8px | 按钮、输入框 |
| `--radius-lg` | 12px | 卡片、弹窗 |

### 阴影 (Shadows)
| 名称 | 值 | 用途 |
|------|-----|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 常规卡片悬浮 |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | 下拉菜单、弹窗 |

---

## 组件规范 (Components)

### Button 按钮
<!-- 描述主要组件的外观组合逻辑 -->
```css
/* Primary Button */
background: var(--primary);
color: var(--primary-foreground);
border-radius: var(--radius-md);
padding: 8px 16px;
font-weight: 500;
```

### Card 卡片
```css
/* Default Card */
background: var(--card);
border: 1px solid var(--border);
border-radius: var(--radius-lg);
box-shadow: none; /* 或 var(--shadow-sm) */
padding: 24px;
```

---

## 使用约束 (Constraints & Rules)

### 必须遵守 (Must)
1. **保持对比度** - 确保主要文本在背景色上有足够的对比度 (WCAG AA)。
2. **规范间距** - 仅使用间距系统中的定义，不要使用硬编码的 px。

### 建议做法 (Should)
1. **适度留白** - 使用足够的大间距分隔无关区块。
2. **分级清晰** - 按钮区分 Primary/Secondary/Ghost 状态。

### 禁止做法 (Must Not)
1. **滥用主色** - 不要将主色用作大面积背景，仅用于重要行动召唤(CTA)。
2. **过多字体组合** - 单页字体字重尽量不超过 3 种变体。
