/**
 * 所属地域级联选择器（省/市 → 区县）
 *
 * 触发框复用 .filter-item 视觉契约；下拉为双面板级联：
 * - 左面板：省本级（末级，直接选中）+ 各市州（悬停展开右面板）
 * - 右面板：当前市州下属区县，点击选中
 * - 选中市州或区县均以名称字符串回传（与列表 region 字段直接匹配）
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './region-cascader.css';

/** 湖南省行政区划（演示数据）：省本级 + 14 个市州 → 区县 */
const HUNAN_REGIONS: Array<{ name: string; children?: string[] }> = [
  { name: '省本级' },
  { name: '长沙市', children: ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区', '望城区', '长沙县', '宁乡市', '浏阳市'] },
  { name: '株洲市', children: ['荷塘区', '芦淞区', '石峰区', '天元区', '渌口区', '攸县', '茶陵县', '炎陵县', '醴陵市'] },
  { name: '湘潭市', children: ['雨湖区', '岳塘区', '湘潭县', '湘乡市', '韶山市'] },
  { name: '衡阳市', children: ['珠晖区', '雁峰区', '石鼓区', '蒸湘区', '南岳区', '衡阳县', '衡南县', '衡山县', '衡东县', '祁东县', '耒阳市', '常宁市'] },
  { name: '邵阳市', children: ['双清区', '大祥区', '北塔区', '新邵县', '邵阳县', '隆回县', '洞口县', '绥宁县', '新宁县', '城步苗族自治县', '武冈市', '邵东市'] },
  { name: '岳阳市', children: ['岳阳楼区', '云溪区', '君山区', '岳阳县', '华容县', '湘阴县', '平江县', '汨罗市', '临湘市'] },
  { name: '常德市', children: ['武陵区', '鼎城区', '安乡县', '汉寿县', '澧县', '临澧县', '桃源县', '石门县', '津市市'] },
  { name: '张家界市', children: ['永定区', '武陵源区', '慈利县', '桑植县'] },
  { name: '益阳市', children: ['资阳区', '赫山区', '南县', '桃江县', '安化县', '沅江市'] },
  { name: '郴州市', children: ['北湖区', '苏仙区', '桂阳县', '宜章县', '永兴县', '嘉禾县', '临武县', '汝城县', '桂东县', '安仁县', '资兴市'] },
  { name: '永州市', children: ['零陵区', '冷水滩区', '祁阳县', '东安县', '双牌县', '道县', '江永县', '宁远县', '蓝山县', '新田县', '江华瑶族自治县'] },
  { name: '怀化市', children: ['鹤城区', '中方县', '沅陵县', '辰溪县', '溆浦县', '会同县', '麻阳苗族自治县', '新晃侗族自治县', '芷江侗族自治县', '靖州苗族侗族自治县', '通道侗族自治县', '洪江市'] },
  { name: '娄底市', children: ['娄星区', '双峰县', '新化县', '冷水江市', '涟源市'] },
  { name: '湘西土家族苗族自治州', children: ['吉首市', '泸溪县', '凤凰县', '花垣县', '保靖县', '古丈县', '永顺县', '龙山县'] }
];

const RadioDot = ({ checked }: { checked: boolean }) => (
  <span className={'rc-radio' + (checked ? ' checked' : '')}>{checked && <i />}</span>
);

interface RegionCascaderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const RegionCascader = ({ value, onChange, label = '所属地域', placeholder = '请选择' }: RegionCascaderProps) => {
  const [open, setOpen] = useState(false);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // 展开时默认高亮已选中市州，便于直接看到其区县
  useEffect(() => {
    if (open) {
      const hit = HUNAN_REGIONS.find(r => r.children && r.children.includes(value));
      setActiveCity(hit ? hit.name : null);
    }
  }, [open, value]);

  // 点击组件外部关闭下拉
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setActiveCity(null);
  };

  const activeChildren = HUNAN_REGIONS.find(r => r.name === activeCity)?.children || [];

  return (
    <div className="rc" ref={boxRef}>
      <button
        type="button"
        className={'rc-trigger' + (open ? ' open' : '') + (value ? '' : ' empty')}
        onClick={() => setOpen(!open)}
      >
        <label>{label}</label>
        <span className="rc-value">{value || placeholder}</span>
        <ChevronDown size={13} className="rc-arrow" />
      </button>
      {open && (
        <div className="rc-dropdown">
          <div className="rc-panel">
            {HUNAN_REGIONS.map(region => {
              const hasChildren = !!region.children?.length;
              const active = activeCity === region.name;
              return (
                <div
                  key={region.name}
                  className={'rc-option' + (active ? ' active' : '') + (value === region.name ? ' selected' : '')}
                  onMouseEnter={() => hasChildren && setActiveCity(region.name)}
                  onClick={() => (hasChildren ? setActiveCity(region.name) : select(region.name))}
                >
                  {/* 市州行：点行展开区县面板，点行首单选钮选中该市州；省本级行整行选中 */}
                  {hasChildren && (
                    <span
                      className="rc-radio-wrap"
                      title={'筛选 ' + region.name}
                      onClick={e => { e.stopPropagation(); select(region.name); }}
                    >
                      <RadioDot checked={value === region.name} />
                    </span>
                  )}
                  {!hasChildren && <RadioDot checked={value === region.name} />}
                  <span className="rc-label">{region.name}</span>
                  {hasChildren && <ChevronRight size={13} className="rc-expand" />}
                </div>
              );
            })}
          </div>
          {activeChildren.length > 0 && (
            <div className="rc-panel rc-sub">
              {activeChildren.map(district => (
                <div key={district} className={'rc-option' + (value === district ? ' selected' : '')} onClick={() => select(district)}>
                  <RadioDot checked={value === district} />
                  <span className="rc-label">{district}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionCascader;
