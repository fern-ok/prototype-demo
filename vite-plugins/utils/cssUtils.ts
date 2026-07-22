/**
 * CSS 增量合并函数
 * 相同选择器：增加新属性，更新已有属性
 */
export function mergeCss(existingCss: string, newCss: string): string {
  const parseCss = (css: string): Map<string, Map<string, string>> => {
    const rules = new Map<string, Map<string, string>>();
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;
    
    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      if (!rules.has(selector)) {
        rules.set(selector, new Map());
      }
      
      const props = rules.get(selector)!;
      const propRegex = /([^:;]+):([^;]+)/g;
      let propMatch;
      
      while ((propMatch = propRegex.exec(declarations)) !== null) {
        const property = propMatch[1].trim();
        const value = propMatch[2].trim();
        props.set(property, value);
      }
    }
    
    return rules;
  };

  const serializeCss = (rules: Map<string, Map<string, string>>): string => {
    const lines: string[] = [];
    
    for (const [selector, props] of rules) {
      lines.push(`${selector} {`);
      for (const [property, value] of props) {
        lines.push(`  ${property}: ${value};`);
      }
      lines.push('}\n');
    }
    
    return lines.join('\n');
  };

  const existingRules = parseCss(existingCss);
  const newRules = parseCss(newCss);

  for (const [selector, newProps] of newRules) {
    if (!existingRules.has(selector)) {
      existingRules.set(selector, newProps);
    } else {
      const existingProps = existingRules.get(selector)!;
      for (const [property, value] of newProps) {
        existingProps.set(property, value);
      }
    }
  }

  return serializeCss(existingRules);
}
