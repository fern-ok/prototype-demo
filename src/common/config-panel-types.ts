/**
 * ConfigPanel API Type Definitions
 * 配置面板 API 类型定义
 * 
 * @version 2.0
 * @author Lintendo
 * @description 可扩展的属性配置系统，支持第三方集成使用
 * 
 * 核心特性：
 * - 声明式配置
 * - 树形结构组织
 * - 动态显示/隐藏
 * - 丰富的组件类型
 */

// ============================================================================
// 核心类型定义 Core Type Definitions
// ============================================================================

/**
 * 配置项基础属性
 * Base properties for all configuration items
 */
export interface AttributeComponentProps {
  /** 组件类型 Component type (e.g., 'input', 'select', 'colorPicker') */
  type?: string;
  
  /** 属性唯一标识符 Unique attribute identifier (supports dot notation like 'style.fontSize') */
  attributeId?: string;
  
  /** 显示名称 Display name shown in UI */
  displayName?: string;
  
  /** 描述信息（提示文本） Description or tooltip text */
  info?: string;
  
  /** 默认值 Initial/default value */
  initialValue?: any;
  
  /** 子配置项 Child configuration items (for nested structures) */
  children?: AttributeComponentProps[];
  
  /** 是否显示 Whether to show this item (default: true) */
  show?: boolean;
  
  /** 组件特定配置 Component-specific configuration properties */
  [k: string]: any;
}

/**
 * 完整配置对象
 * Complete configuration object
 */
export interface AttributesConfig {
  /** 配置树 Configuration tree */
  config: AttributeComponentProps;
}

// ============================================================================
// 布局组件 Layout Components
// ============================================================================

/**
 * 分组配置
 * Group configuration
 * 
 * @description 用于在面板内部进行逻辑分组
 * Used for logical grouping within panels
 */
export interface GroupConfig extends AttributeComponentProps {
  type: 'group';
  
  /** 分组显示名称 Group display name */
  displayName: string;
  
  /** 显示类型 Display type ('inline' for inline display) */
  displayType?: 'inline' | 'default';
  
  /** 分组内的配置项 Configuration items within the group */
  children: AttributeComponentProps[];
}

// ============================================================================
// 基础输入组件 Basic Input Components
// ============================================================================

/**
 * 文本输入框配置
 * Text input configuration
 */
export interface InputConfig extends AttributeComponentProps {
  type: 'input';
  attributeId: string;
  displayName: string;
  
  /** 占位符文本 Placeholder text */
  placeholder?: string;
  
  /** 输入框宽度 Input width (default: '40%') */
  width?: string;
  
  /** 是否禁用 Whether disabled */
  disabled?: boolean;
  
  /** 初始值 Initial value */
  initialValue?: string;
}

/**
 * 数字输入框配置
 * Number input configuration
 */
export interface InputNumberConfig extends AttributeComponentProps {
  type: 'inputNumber';
  attributeId: string;
  displayName: string;
  
  /** 最小值 Minimum value */
  min?: number;
  
  /** 最大值 Maximum value */
  max?: number;
  
  /** 步长 Step increment (default: 1) */
  step?: number;
  
  /** 占位符文本 Placeholder text */
  placeholder?: string;
  
  /** 初始值 Initial value */
  initialValue?: number;
}

/**
 * 复选框配置
 * Checkbox configuration
 */
export interface CheckboxConfig extends AttributeComponentProps {
  type: 'checkbox';
  attributeId: string;
  displayName: string;
  
  /** 是否禁用 Whether disabled */
  disabled?: boolean;
  
  /** 初始值 Initial value */
  initialValue?: boolean;
}

/**
 * 滑块配置
 * Slider configuration
 */
export interface SliderConfig extends AttributeComponentProps {
  type: 'slider';
  attributeId: string;
  displayName: string;
  
  /** 最小值 Minimum value */
  min: number;
  
  /** 最大值 Maximum value */
  max: number;
  
  /** 步长 Step increment */
  step?: number;
  
  /** 是否显示数字输入框 Whether to show number input alongside slider */
  showInputNumber?: boolean;
  
  /** 初始值 Initial value */
  initialValue?: number;
}

// ============================================================================
// 选择组件 Selection Components
// ============================================================================

/**
 * 选项定义
 * Option definition for select components
 */
export interface SelectOption {
  /** 显示标签 Display label */
  label: string;
  
  /** 选项值 Option value */
  value: string | number;
}

/**
 * 下拉选择框配置
 * Select dropdown configuration
 */
export interface SelectConfig extends AttributeComponentProps {
  type: 'select';
  attributeId: string;
  displayName: string;
  
  /** 选项数组 Array of options */
  options: SelectOption[];
  
  /** 选择模式 Selection mode ('multiple' for multi-select) */
  mode?: 'multiple';
  
  /** 下拉框宽度 Dropdown width (default: 120) */
  dropdownMatchSelectWidth?: number;
  
  /** 初始值 Initial value */
  initialValue?: string | number | string[] | number[];
}

/**
 * 自动完成配置
 * AutoComplete configuration
 */
export interface AutoCompleteConfig extends AttributeComponentProps {
  type: 'autoComplete';
  attributeId: string;
  displayName: string;
  
  /** 建议选项数组 Array of suggestion options */
  options: SelectOption[];
  
  /** 弹出框宽度 Popup width (default: 200) */
  popupMatchSelectWidth?: number;
  
  /** 初始值 Initial value */
  initialValue?: string;
}

// ============================================================================
// 颜色组件 Color Components
// ============================================================================

/**
 * 颜色选择器配置
 * Color picker configuration
 */
export interface ColorPickerConfig extends AttributeComponentProps {
  type: 'colorPicker';
  attributeId: string;
  displayName: string;
  
  /** 选择器类型 Picker type */
  picker?: 'common' | 'lite';
  
  /** 初始值 Initial color value (hex format) */
  initialValue?: string;
}


// ============================================================================
// 复杂数据组件 Complex Data Components
// ============================================================================

/**
 * 数组数据编辑器配置
 * Array data editor configuration
 * 
 * @description 弹窗编辑，每行一个数据项
 * Modal editor, one item per line
 */
export interface ArrayDataConfig extends AttributeComponentProps {
  type: 'arrayData';
  attributeId: string;
  displayName: string;
  
  /** 初始值 Initial array value */
  initialValue?: string[];
}

/**
 * 表格列定义
 * Table column definition
 */
export interface TableColumn {
  /** 字段名 Field name */
  name: string;
  
  /** 列显示名 Column display name */
  colName: string;
  
  /** 输入类型 Input type */
  type: 'text' | 'select' | 'color' | 'number' | 'icon';
  
  /** select 类型的选项 Options for select type */
  options?: SelectOption[];
}

/**
 * 表格数据编辑器配置
 * Table data editor configuration
 * 
 * @description 支持添加、删除、复制、排序行
 * Supports add, delete, copy, and reorder rows
 */
export interface TableConfig extends AttributeComponentProps {
  type: 'table';
  attributeId: string;
  displayName: string;
  
  /** 是否为 Map 结构（以第一列值为 key） Whether to use Map structure (first column as key) */
  isMap?: boolean;
  
  /** 列定义数组 Array of column definitions */
  columns: TableColumn[];
  
  /** 初始值 Initial table data */
  initialValue?: any[];
}

/**
 * Map 列定义
 * Map column definition
 */
export interface MapColumn {
  /** 键名 Key name */
  key: string;
  
  /** 列显示名 Column display name */
  colName: string;
  
  /** 输入类型 Input type */
  type: 'text' | 'select' | 'color' | 'number' | 'icon';
  
  /** 属性 ID（支持 {key} 占位符） Attribute ID (supports {key} placeholder) */
  attributeId: string;
  
  /** select 类型的选项 Options for select type */
  options?: SelectOption[];
}

/**
 * 键值对数据编辑器配置
 * Key-value pair data editor configuration
 * 
 * @description 固定键名，编辑值，支持嵌套属性更新
 * Fixed keys, editable values, supports nested property updates
 */
export interface MapConfig extends AttributeComponentProps {
  type: 'map';
  attributeId: string;
  displayName: string;
  
  /** 列定义数组 Array of column definitions */
  columns: MapColumn[];
  
  /** 初始值 Initial map value */
  initialValue?: Record<string, any>;
}

// ============================================================================
// 组合组件 Composite Components
// ============================================================================

/**
 * 字体设置配置
 * Font setting configuration
 * 
 * @description 组合了颜色、字号、字重、透明度等设置
 * Combines color, size, weight, opacity settings
 */
export interface FontSettingConfig extends AttributeComponentProps {
  type: 'fontSetting';
  displayName: string;
  
  /** 属性 ID 映射 Attribute ID mapping */
  attributeIdMap: {
    fontColor?: string;
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    textAlign?: string;
    opacity?: string;
  };
  
  /** 初始值 Initial values */
  initialValue?: {
    fontColor?: string;
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    textAlign?: string;
    opacity?: number;
  };
}

/**
 * 线条设置配置
 * Line setting configuration
 * 
 * @description 组合了线条颜色、线宽、虚线样式、长度等设置
 * Combines line color, width, dash style, length settings
 */
export interface LineSettingConfig extends AttributeComponentProps {
  type: 'lineSetting';
  displayName: string;
  
  /** 属性 ID 映射 Attribute ID mapping */
  attributeIdMap: {
    lineWidth?: string;
    lineColor?: string;
    lineDash?: string;
    length?: string;
  };
  
  /** 初始值 Initial values */
  initialValue?: {
    lineWidth?: number;
    lineColor?: string;
    lineDash?: number[];
    length?: number;
  };
}

/**
 * 端点设置配置
 * Point setting configuration
 * 
 * @description 用于设置线条端点样式
 * Used for setting line endpoint styles
 */
export interface PointSettingConfig extends AttributeComponentProps {
  type: 'pointSetting';
  displayName: string;
  attributeIdMap?: Record<string, string>;
  initialValue?: any;
}


// ============================================================================
// 使用示例 Usage Examples
// ============================================================================

/**
 * 完整配置示例
 * Complete configuration example
 * 
 * @example
 * const config: AttributesConfig = {
 *   config: {
 *     type: 'collapse',
 *     children: [
 *       {
 *         displayName: '基础设置',
 *         show: true,
 *         children: [
 *           {
 *             type: 'input',
 *             attributeId: 'title',
 *             displayName: '标题',
 *             initialValue: '默认标题',
 *             placeholder: '请输入标题'
 *           },
 *           {
 *             type: 'checkbox',
 *             attributeId: 'showBorder',
 *             displayName: '显示边框',
 *             initialValue: true
 *           },
 *           {
 *             type: 'colorPicker',
 *             attributeId: 'borderColor',
 *             displayName: '边框颜色',
 *             initialValue: '#000000'
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * };
 */

// ============================================================================
// 最佳实践 Best Practices
// ============================================================================

/**
 * 最佳实践指南
 * Best Practices Guide
 * 
 * 1. attributeId 命名规范 Naming Convention:
 *    - 使用点分隔的路径 Use dot-separated paths: 'style.fontSize'
 *    - 保持一致性和可读性 Maintain consistency and readability
 *    - 避免使用特殊字符 Avoid special characters
 * 
 * 2. 初始值设置 Initial Values:
 *    - 始终提供合理的 initialValue Always provide reasonable initialValue
 *    - 确保初始值类型与组件匹配 Ensure type matches component
 * 
 * 3. 分组组织 Grouping:
 *    - 使用 Collapse 组织大量配置项 Use Collapse for many items
 *    - 使用 Group 进行逻辑分组 Use Group for logical grouping
 *    - 相关配置项放在一起 Keep related items together
 * 
 * 4. 性能优化 Performance:
 *    - 避免过深的嵌套层级 Avoid deep nesting
 *    - 合理使用 show 属性预先隐藏不需要的项 Use show to hide unnecessary items
 *    - 大量数据使用 Table 或 Map 组件 Use Table/Map for large datasets
 */

