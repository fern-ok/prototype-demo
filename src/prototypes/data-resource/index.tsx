/**
 * @name 数据资源列表
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * 数据资源列表页面，优化地域筛选功能
 */

import { useState } from 'react';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

const OriginalComponent = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [showDistrictPanel, setShowDistrictPanel] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const cities = [
    { id: 'changsha', name: '长沙市', districts: ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区', '望城区', '长沙县', '宁乡市', '浏阳市'] },
    { id: 'zhuzhou', name: '株洲市', districts: ['荷塘区', '芦淞区', '石峰区', '天元区', '株洲县', '攸县', '茶陵县', '炎陵县', '醴陵市'] },
    { id: 'xiangtan', name: '湘潭市', districts: ['雨湖区', '岳塘区', '湘潭县', '湘乡市', '韶山市'] },
    { id: 'hengyang', name: '衡阳市', districts: ['珠晖区', '雁峰区', '石鼓区', '蒸湘区', '南岳区', '衡阳县', '衡南县', '衡山县', '衡东县', '祁东县', '耒阳市', '常宁市'] },
    { id: 'shaoyang', name: '邵阳市', districts: ['双清区', '大祥区', '北塔区', '邵东县', '新邵县', '邵阳县', '隆回县', '洞口县', '绥宁县', '新宁县', '城步苗族自治县', '武冈市'] },
    { id: 'yueyang', name: '岳阳市', districts: ['岳阳楼区', '云溪区', '君山区', '岳阳县', '华容县', '湘阴县', '平江县', '汨罗市', '临湘市'] },
    { id: 'changde', name: '常德市', districts: ['武陵区', '鼎城区', '安乡县', '汉寿县', '澧县', '临澧县', '桃源县', '石门县', '津市市'] },
    { id: 'zhangjiajie', name: '张家界市', districts: ['永定区', '武陵源区', '慈利县', '桑植县'] },
    { id: '益阳', name: '益阳市', districts: ['资阳区', '赫山区', '南县', '桃江县', '安化县', '沅江市'] },
    { id: 'chenzhou', name: '郴州市', districts: ['北湖区', '苏仙区', '桂阳县', '宜章县', '永兴县', '嘉禾县', '临武县', '汝城县', '桂东县', '安仁县', '资兴市'] },
    { id: 'yongzhou', name: '永州市', districts: ['零陵区', '冷水滩区', '祁阳县', '东安县', '双牌县', '道县', '江永县', '宁远县', '蓝山县', '新田县', '江华瑶族自治县'] },
    { id: 'huaihua', name: '怀化市', districts: ['鹤城区', '中方县', '沅陵县', '辰溪县', '溆浦县', '会同县', '麻阳苗族自治县', '新晃侗族自治县', '芷江侗族自治县', '靖州苗族侗族自治县', '通道侗族自治县', '洪江市'] },
    { id: 'loudi', name: '娄底市', districts: ['娄星区', '双峰县', '新化县', '冷水江市', '涟源市'] },
    { id: 'xiangxi', name: '湘西土家族苗族自治州', districts: ['吉首市', '泸溪县', '凤凰县', '花垣县', '保靖县', '古丈县', '永顺县', '龙山县'] },
    { id: 'benben', name: '省本级', districts: [] }
  ];

  const domains = [
    { id: 'health', name: '卫生健康', count: 12 },
    { id: 'medical', name: '医疗保障', count: 8 },
    { id: 'education', name: '教育', count: 6 },
    { id: 'culture', name: '文化旅游', count: 5 },
    { id: 'transport', name: '交通运输', count: 7 },
    { id: 'urban', name: '城市治理', count: 4 },
    { id: 'nature', name: '自然资源', count: 9 },
    { id: 'industry', name: '工业制造', count: 3 },
    { id: 'finance', name: '创新金融', count: 6 },
    { id: 'agriculture', name: '智慧农业', count: 5 },
    { id: 'sports', name: '体育竞技', count: 2 },
    { id: 'finance_service', name: '金融服务', count: 8 },
    { id: 'public_safety', name: '公共安全', count: 4 },
    { id: 'three_mobile', name: '三变联动', count: 1 },
    { id: 'transport_river', name: '运河盐业', count: 2 },
    { id: 'medical_insurance', name: '医疗保障', count: 3 },
    { id: 'emergency', name: '应急管理', count: 4 }
  ];

  const resources = [
    { id: 1, name: '湖南省卫生健康筛查统计', provider: '湖南省卫生健康委员会统计中心', area: '省本级', domain: '卫生健康', updateTime: '2024/06/16', format: 'et' },
    { id: 2, name: '湖南省卫生健康排查数据资源', provider: '湖南省卫生健康委员会统计中心', area: '省本级', domain: '卫生健康', updateTime: '2024/06/15', format: 'wps' },
    { id: 3, name: '湖南省医疗就诊数据资源', provider: '湖南省卫生健康委员会统计中心', area: '省本级', domain: '卫生健康', updateTime: '2024/06/15', format: 'mysql' },
    { id: 4, name: '长沙市人口健康数据', provider: '长沙市卫生健康委员会', area: '长沙市', domain: '卫生健康', updateTime: '2024/06/14', format: 'csv' },
    { id: 5, name: '株洲市医疗服务数据', provider: '株洲市卫生健康委员会', area: '株洲市', domain: '医疗保障', updateTime: '2024/06/13', format: 'json' },
    { id: 6, name: '湘潭市公共卫生数据', provider: '湘潭市卫生健康委员会', area: '湘潭市', domain: '卫生健康', updateTime: '2024/06/12', format: 'xml' },
    { id: 7, name: '衡阳市健康档案数据', provider: '衡阳市卫生健康委员会', area: '衡阳市', domain: '卫生健康', updateTime: '2024/06/11', format: 'csv' },
    { id: 8, name: '湖南省教育统计数据', provider: '湖南省教育厅', area: '省本级', domain: '教育', updateTime: '2024/06/10', format: 'excel' }
  ];

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedDistrict('');
    setShowDistrictPanel(cityId && cities.find(c => c.id === cityId)?.districts.length > 0);
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
  };

  const toggleDomain = (domainId: string) => {
    setSelectedDomains(prev => 
      prev.includes(domainId) 
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  const resetFilters = () => {
    setSelectedCity('');
    setSelectedDistrict('');
    setShowDistrictPanel(false);
    setSelectedDomains([]);
  };

  const currentCity = cities.find(c => c.id === selectedCity);

  return (
    <div className="resource-container">
      <header className="page-header">
        <div className="header-left">
          <div className="logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <div className="logo-text">
              <span className="logo-title">湖南省公共数据授权运营平台</span>
              <span className="logo-subtitle">Hunan Public Data Authorization Operation Platform</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="login-btn">登录</button>
          <button className="register-btn">注册</button>
        </div>
      </header>

      <nav className="main-nav">
        <button className="nav-item active">首页</button>
        <button className="nav-item">数据资源</button>
        <button className="nav-item">数据产品</button>
        <button className="nav-item">发布需求</button>
        <button className="nav-item">新闻公告</button>
        <button className="nav-item">帮助中心</button>
      </nav>

      <div className="main-content">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>行业分类</h3>
            <div className="category-list">
              <button className="category-item active">全部 (77)</button>
              <button className="category-item">农、林、牧、渔业 (21)</button>
              <button className="category-item">采矿业 (9)</button>
              <button className="category-item">制造业 (11)</button>
              <button className="category-item">电力、热力、燃气及水生产和供应业 (3)</button>
              <button className="category-item">建筑业 (2)</button>
              <button className="category-item">批发和零售业 (3)</button>
              <button className="category-item">交通运输、仓储和邮政业 (1)</button>
              <button className="category-item">住宿和餐饮业 (0)</button>
              <button className="category-item">信息传输、软件和信息技术服务业 (5)</button>
              <button className="category-item">金融业 (3)</button>
              <button className="category-item">房地产业 (0)</button>
              <button className="category-item">科学研究和技术服务业 (0)</button>
              <button className="category-item">租赁和商务服务业 (0)</button>
              <button className="category-item">水利、环境和公共设施管理业 (0)</button>
              <button className="category-item">居民服务、修理和其他服务业 (0)</button>
            </div>
          </div>
          <div className="sidebar-section">
            <h3>浏览排行</h3>
            <div className="ranking-list">
              <div className="ranking-item">
                <span className="rank">1</span>
                <span className="title">人口健康基础库</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="content-area">
          <div className="search-box large">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#909399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="请输入数据资源名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button className="search-btn">搜索</button>
          </div>

          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">所属地域</label>
                <div className="location-picker">
                  <div className="city-select">
                    <select 
                      value={selectedCity} 
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="city-dropdown"
                    >
                      <option value="">请选择市州</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                    {currentCity && currentCity.districts.length > 0 && (
                      <button 
                        className={`expand-btn ${showDistrictPanel ? 'expanded' : ''}`}
                        onClick={() => setShowDistrictPanel(!showDistrictPanel)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9h12M12 6v12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {showDistrictPanel && currentCity && (
                    <div className="district-panel">
                      <div className="district-header">
                        <span>{currentCity.name} - 区县</span>
                        <button 
                          className="clear-btn" 
                          onClick={() => { setSelectedDistrict(''); setShowDistrictPanel(false); }}
                        >
                          清除
                        </button>
                      </div>
                      <div className="district-grid">
                        {currentCity.districts.map((district, index) => (
                          <button 
                            key={index}
                            className={`district-item ${selectedDistrict === district ? 'selected' : ''}`}
                            onClick={() => handleDistrictChange(district)}
                          >
                            {district}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDistrict && (
                    <div className="selected-location">
                      <span className="location-tag">
                        {currentCity?.name} - {selectedDistrict}
                        <button className="remove-tag" onClick={() => setSelectedDistrict('')}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">领域名称</label>
                <div className="domain-tags">
                  {domains.slice(0, 6).map(domain => (
                    <button 
                      key={domain.id}
                      className={`domain-tag ${selectedDomains.includes(domain.id) ? 'selected' : ''}`}
                      onClick={() => toggleDomain(domain.id)}
                    >
                      {domain.name}
                      <span className="tag-count">{domain.count}</span>
                    </button>
                  ))}
                  <button className="expand-domains">
                    展开
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9h12M12 6v12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <button className="reset-btn" onClick={resetFilters}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              重置筛选
            </button>
          </div>

          <div className="results-header">
            <span className="results-count">共 {resources.length} 个数据资源</span>
            <div className="sort-options">
              <span className="sort-label">排序：</span>
              <button className="sort-option active">浏览次数</button>
              <button className="sort-option">授权次数</button>
              <button className="sort-option">更新时间</button>
            </div>
          </div>

          <div className="resource-grid">
            {resources.map(resource => (
              <div key={resource.id} className="resource-card">
                <div className="card-header">
                  <div className="resource-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#409eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <h3 className="resource-name">{resource.name}</h3>
                </div>
                <p className="resource-provider">{resource.provider}</p>
                <div className="resource-tags">
                  <span className="tag area-tag">{resource.area}</span>
                  <span className="tag domain-tag">{resource.domain}</span>
                  <span className="tag format-tag">{resource.format}</span>
                </div>
                <div className="card-footer">
                  <span className="update-time">更新时间：{resource.updateTime}</span>
                  <div className="card-actions">
                    <button className="action-btn">详情</button>
                    <button className="action-btn primary">申请</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;