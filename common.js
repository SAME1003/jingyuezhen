// ========== 游戏状态 ==========
const GAME_STATE = {
  discoveries: {
    well_location: false,      // 发现北井位置
    forum_secret: false,       // 发现论坛秘密帖子
    archive_2003: false,       // 解锁2003档案
    phone_easter: false,       // 发现电话彩蛋
    glitch_text: false,        // 注意到文字异常
    hidden_link: false,        // 发现隐藏链接
    found_all_clues: false,    // 发现所有主要线索
  },
  fearLayer: 0,  // 0-4 恐惧层级
  ending: null,
  playthrough: 1,
};

const TOTAL_CLUES = 6; // 主要线索数量

// ========== 存档 ==========
function saveProgress() {
  try {
    localStorage.setItem('jingyue_save', JSON.stringify(GAME_STATE));
  } catch(e) {}
}

function loadProgress() {
  try {
    const saved = localStorage.getItem('jingyue_save');
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(GAME_STATE.discoveries, data.discoveries || {});
      GAME_STATE.fearLayer = data.fearLayer || 0;
      GAME_STATE.ending = data.ending || null;
      GAME_STATE.playthrough = data.playthrough || 1;
      applyFearLayer();
    }
  } catch(e) {}
}

// ========== 恐惧层级系统 ==========
function applyFearLayer() {
  document.body.classList.remove('layer-1','layer-2','layer-3','layer-4');
  if (GAME_STATE.fearLayer > 0) {
    document.body.classList.add('layer-' + GAME_STATE.fearLayer);
  }
}

function increaseFear() {
  if (GAME_STATE.fearLayer < 4) {
    GAME_STATE.fearLayer++;
    applyFearLayer();
    saveProgress();
    // 页面抖动效果
    if (GAME_STATE.fearLayer >= 2) {
      document.body.classList.add('shaking');
      setTimeout(() => document.body.classList.remove('shaking'), 300);
    }
  }
}

// ========== 发现隐藏线索 ==========
function discoverHidden(clueId) {
  if (GAME_STATE.discoveries[clueId]) return;
  GAME_STATE.discoveries[clueId] = true;
  increaseFear();
  updateProgressHUD();
  saveProgress();

  const messages = {
    well_location: '地图西北角有个红点，没有标注地名。',
    forum_secret: '这个帖子里有些内容不太对劲。',
    archive_2003: '档案打开了。',
    phone_easter: '电话里只有忙音。这个号码可能不存在。',
    glitch_text: '页面上有些字在闪。',
    hidden_link: '你找到了一个没有标注的链接。',
  };

  if (messages[clueId]) {
    showToast(messages[clueId], true);
  }

  // 检查是否发现所有线索
  checkAllClues();
}

function checkAllClues() {
  const mainClues = ['well_location', 'forum_secret', 'archive_2003', 'phone_easter', 'glitch_text', 'hidden_link'];
  const found = mainClues.filter(c => GAME_STATE.discoveries[c]).length;
  if (found >= 4 && !GAME_STATE.discoveries.found_all_clues) {
    GAME_STATE.discoveries.found_all_clues = true;
    document.getElementById('truthBtn').style.display = 'inline-block';
    document.getElementById('jumpInBtn').style.display = 'inline-block';
    showToast('你觉得差不多了。去北井看看。', true);
  }
}

// ========== 进度HUD ==========
function updateProgressHUD() {
  const clues = [
    { id: 'well_location', name: '发现北井位置' },
    { id: 'forum_secret', name: '发现论坛秘密' },
    { id: 'archive_2003', name: '解锁2003档案' },
    { id: 'phone_easter', name: '发现异常号码' },
    { id: 'glitch_text', name: '注意到文字异常' },
    { id: 'hidden_link', name: '发现隐藏链接' },
  ];

  const found = clues.filter(c => GAME_STATE.discoveries[c.id]).length;
  const percent = Math.round((found / TOTAL_CLUES) * 100);
  document.getElementById('progressBar').style.width = percent + '%';

  const list = document.getElementById('progressList');
  list.innerHTML = clues.map(c =>
    `<li><span class="${GAME_STATE.discoveries[c.id] ? 'progress-icon-done' : 'progress-icon-todo'}">${GAME_STATE.discoveries[c.id] ? '✓' : '○'}</span> ${c.name}</li>`
  ).join('');
}

function getTotalProgress() {
  const clues = ['well_location', 'forum_secret', 'archive_2003', 'phone_easter', 'glitch_text', 'hidden_link'];
  const found = clues.filter(c => GAME_STATE.discoveries[c]).length;
  return Math.round((found / TOTAL_CLUES) * 100);
}

// ========== 页面导航 ==========
function navigateTo(pageId) {
  window.location.href = pageId + '.html';
}

function initPage(pageId) {
  // 补全HUD结构（防止HTML提取不完整）
  var hud = document.querySelector('.progress-hud');
  if (hud && !document.getElementById('progressDetail')) {
    var detail = document.createElement('div');
    detail.className = 'progress-hud-detail';
    detail.id = 'progressDetail';
    detail.innerHTML = '<ul id="progressList"></ul>';
    hud.appendChild(detail);
  }
  loadProgress();
  var es = document.getElementById('endingScreen');
  if (es) es.style.display = 'none';
  applyFearLayer();
  updateProgressHUD();

  if (pageId === 'about') {
    setTimeout(function() {
      if (!GAME_STATE.discoveries.glitch_text) {
        discoverHidden('glitch_text');
      }
    }, 2000);
  }

  if (pageId === 'well') {
    if (GAME_STATE.fearLayer < 3) {
      GAME_STATE.fearLayer = 3;
      applyFearLayer();
      saveProgress();
    }
    var totalProg = getTotalProgress();
    if (totalProg >= 100) {
      // 进度100%：隐藏原来的按钮，触发红字突脸剧情
      var jb = document.getElementById('jumpInBtn');
      var tb = document.getElementById('truthBtn');
      var wc = document.getElementById('wellChoices');
      if (jb) jb.style.display = 'none';
      if (tb) tb.style.display = 'none';
      if (wc) wc.style.display = 'none';
      setTimeout(function() {
        triggerJumpScare();
      }, 1500);
    } else if (GAME_STATE.discoveries.found_all_clues) {
      // 发现主要线索但未到100%：显示按钮
      var jb2 = document.getElementById('jumpInBtn');
      var tb2 = document.getElementById('truthBtn');
      if (jb2) jb2.style.display = 'inline-block';
      if (tb2) tb2.style.display = 'inline-block';
    }
  }

  document.querySelectorAll('.hidden-link').forEach(function(link) {
    link.addEventListener('click', function() {
      if (!GAME_STATE.discoveries.hidden_link) {
        discoverHidden('hidden_link');
      }
    });
  });

  var searchInput = document.getElementById('siteSearch');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleSearch();
    });
  }

  // 页面特定初始化
  if (pageId === 'home') {
    var hn = document.getElementById('homeNewsList');
    if (hn) {
      hn.innerHTML = newsData.slice(0,6).map(function(n,i){
        return '<li onclick="showNews('+i+')"><span class="news-title">'+n.title+'</span><span class="news-date">'+n.date.substring(5)+'</span></li>';
      }).join('');
    }
    renderGallery('homeGallery', galleryData.slice(0,6));
  }
  if (pageId === 'news') {
    var fn = document.getElementById('fullNewsList');
    if (fn) {
      fn.innerHTML = newsData.map(function(n,i){
        return '<li onclick="showNews('+i+')"><span class="news-title">'+n.title+'</span><span class="news-date">'+n.date+'</span></li>';
      }).join('');
    }
  }
  if (pageId === 'culture') {
    renderGallery('cultureGallery', galleryData);
  }
  if (pageId === 'archive') {
    if (GAME_STATE.discoveries.archive_2003) {
      var l = document.getElementById('archive2003Label');
      if (l) l.textContent = '2003年异常事件调查档案';
    }
  }
}

// ========== 模态框 ==========
function openModal(id) {
  document.getElementById(id).classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// ========== Toast ==========
function showToast(msg, creepy) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (creepy ? ' creepy' : '');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== 新闻数据 ==========
const newsData = [
  {
    title: '景月镇召开2024年度经济工作会议',
    date: '2024-03-15',
    source: '镇党政办',
    content: `<p>3月15日，景月镇2024年度经济工作会议在镇政府大礼堂召开。镇党委书记张文远讲话，镇长李建国主持。各村（社区）书记、镇属各部门负责人参加。</p>
    <p>2023年全镇地区生产总值18.6亿元，同比增长6.2%；农民人均可支配收入2.8万元。2024年重点抓产业转型、乡村振兴、文旅项目和民生保障四件事。</p>`
  },
  {
    title: '古镇景区上周接待游客8.2万人次',
    date: '2024-03-10',
    source: '镇旅游公司',
    content: `<p>据镇旅游公司统计，3月4日至10日，景月古镇接待游客8.2万人次，同比增长23.5%。春季兰花展和夜游项目是主要增长点。</p>
    <p>周末上午9点到11点入园人最多，建议错峰。另外，井湾村方向的步道因施工暂时封闭，请从主入口进出。</p>`
  },
  {
    title: '我镇组织开展春季环境卫生集中整治',
    date: '2024-03-08',
    source: '镇爱卫办',
    content: `<p>3月7日，镇爱卫办组织约200人对镇区主次干道、背街小巷、河道沿岸进行集中清理。清除卫生死角120余处，清运垃圾8车。</p>
    <p>下一步重点整治井湾村北片的乱堆乱放。该村北片靠近老井区域，部分村民私自堆放的建筑材料已通知限期搬离。</p>`
  },
  {
    title: '镇中心小学开展传统文化体验活动',
    date: '2024-03-05',
    source: '镇教育办',
    content: `<p>3月4日至5日，镇中心小学邀请县文化馆非遗传承人到校，开设剪纸、竹编、糖画体验课。覆盖全校6个年级420名学生。</p>
    <p>有家长反映，孩子回家后说在学校听到了"奇怪的声音"，经校方排查为老旧水管共振所致，已安排维修。</p>`
  },
  {
    title: '景月湖水质提升工程进展通报',
    date: '2024-02-28',
    source: '镇农业农村办',
    content: `<p>景月湖水质提升工程自2023年8月开工，环湖污水管网改造完成75%，底泥清淤完成60%。预计2024年6月底完工。</p>
    <p>施工期间景月湖东岸步道部分路段封闭，请绕行。</p>
    <p class="strikethrough">（注：2003年洪涝后景月湖水系曾出现异常，经治理恢复。档案编号：JYZ-2003-SW-0714）</p>`
  },
  {
    title: '李建国镇长带队检查企业安全生产',
    date: '2024-02-20',
    source: '镇应急管理办',
    content: `<p>2月20日下午，镇长李建国检查了景月酿造厂、恒达竹制品厂等4家企业，重点看消防通道、用电线路和仓库。对3家企业下达限期整改通知书。</p>
    <p>景月酿造厂反映近期厂区夜间有不明人员活动，已提醒加强门卫值守。</p>`
  },
  {
    title: '我镇举办春季招聘会 32家企业提供680个岗位',
    date: '2024-02-15',
    source: '镇社保办',
    content: `<p>2月15日，"春风行动"招聘会在镇文化广场举行。32家企业到场，岗位680余个，集中在制造业、餐饮和旅游行业。当天初步达成意向186人。</p>`
  },
  {
    title: '我镇入选首批省级全域旅游示范镇',
    date: '2024-01-28',
    source: '镇文旅办',
    content: `<p>省文旅厅公布首批省级全域旅游示范镇名单，景月镇在列。2023年全镇接待游客126万人次，旅游综合收入8.2亿元。</p>`
  },
  {
    title: '关于井湾村北片区域临时管制的通知',
    date: '2024-01-20',
    source: '镇综治办',
    content: `<p>因井湾村北片老井区域年久失修，存在安全隐患，自1月22日起对该区域实施临时管制，禁止无关人员进入。管制期限视修缮进度另行通知。</p>
    <p>请附近村民绕行，不要翻越围栏。如有疑问拨打镇综治办电话：0573-8877XXXX。</p>`
  },
  {
    title: '镇卫生院开展冬季传染病防控宣传',
    date: '2024-01-15',
    source: '镇卫生院',
    content: `<p>1月12日至14日，镇卫生院在各村开展冬季传染病防控宣传，发放手册800余份。重点提醒注意呼吸道疾病和胃肠道疾病预防。</p>
    <p>近期门诊接诊中，失眠、梦魇相关主诉有所增加，卫生院建议规律作息，如持续不适请及时就诊。</p>`
  },
  {
    title: '景月镇2023年度人口统计公报',
    date: '2024-01-10',
    source: '镇统计站',
    content: `<p>截至2023年12月31日，景月镇常住人口41872人，比上年减少216人。其中井湾村常住人口1247人，比上年减少89人，为全镇人口减少最多的行政村。</p>
    <p>人口减少主要原因为外出务工和随迁子女就学。</p>`
  },
  {
    title: '古镇夜游项目试运行期间安全提示',
    date: '2023-12-28',
    source: '镇旅游公司',
    content: `<p>古镇夜游项目自12月25日试运行，开放时间为18:00-21:30。试运行期间游客较多，请照看好老人和小孩。</p>
    <p>夜游路线不包含井湾村方向。如在游览中听到异常声响或看到不明光源，请立即向现场工作人员报告，不要自行前往查看。</p>`
  },
  {
    title: '镇文化站整理地方文献资料',
    date: '2023-12-15',
    source: '镇文化站',
    content: `<p>镇文化站近期对馆藏地方文献进行整理，共梳理出镇志、族谱、报刊等资料320余册。其中发现民国时期《景月报》合订本一套，记载了1932年至1937年镇上的大小事。</p>
    <p>有几期报纸存在页面缺失，缺失部分集中在1935年7月前后。文化站欢迎村民提供相关线索。</p>`
  },
  {
    title: '景月湖冬季捕鱼活动取消通知',
    date: '2023-12-08',
    source: '镇农业农村办',
    content: `<p>原定于12月10日举办的景月湖冬季捕鱼活动，因近期湖水水位异常变化，出于安全考虑予以取消。已报名的村民可到镇农业农村办退还报名费。</p>
    <p>水位异常原因正在调查中，请不要在湖边逗留。</p>`
  },
  {
    title: '我镇开展古民居安全排查工作',
    date: '2023-11-30',
    source: '镇建设办',
    content: `<p>11月25日至29日，镇建设办对全镇47处明清古民居进行安全排查，发现7处存在墙体开裂、梁柱腐朽等问题，已通知产权人限期修缮。</p>
    <p>井湾村3处古民居因长期无人居住，损毁较为严重，其中1处后墙已部分坍塌。</p>`
  },
  {
    title: '关于规范镇域内犬只管理的通告',
    date: '2023-11-20',
    source: '镇综治办',
    content: `<p>近期镇区内流浪犬数量有所增加，已发生2起犬只伤人事件。请养犬户拴养或圈养犬只，不要随意遗弃。</p>
    <p>多位村民反映夜间听到犬只集体吠叫，方向集中在井湾村北片。综治办已安排夜间巡逻。</p>`
  },
  {
    title: '景月镇地方志编纂工作启动',
    date: '2023-11-05',
    source: '镇党政办',
    content: `<p>经镇党委研究决定，启动《景月镇志》编纂工作，计划用两年时间完成。编纂委员会由镇党委书记张文远任主任，邀请县地方志办公室专家指导。</p>
    <p>现面向全镇征集老照片、老物件和口述史料。联系人：镇文化站周老师，电话0573-8877XXXX。</p>`
  },
  {
    title: '镇派出所通报近期治安情况',
    date: '2023-10-28',
    source: '镇派出所',
    content: `<p>10月份全镇接警量同比下降12%，治安形势总体平稳。主要警情为邻里纠纷、盗窃和走失求助。</p>
    <p>本月接到3起人员走失报警，均已找回。走失人员均称"不知道怎么就走到了井湾村那边"。派出所提醒村民夜间尽量不要单独外出。</p>`
  },
];

function showNews(index) {
  const news = newsData[index];
  if (!news) return;
  document.getElementById('newsModalTitle').textContent = news.title;
  document.getElementById('newsModalBody').innerHTML = `
    <p style="color:var(--text-muted);font-size:12px;margin-bottom:16px;">
      来源：${news.source} &nbsp;&nbsp; 发布时间：${news.date}
    </p>
    ${news.content}
  `;
  openModal('newsModal');
}

// ========== 画廊数据 ==========
const galleryData = [
  { title: '月牙桥 · 晨雾', image: 'images/02_moon_bridge.jpg', desc: '月牙桥建于明代，是古镇保存最完好的石拱桥。桥面石板被踩得发亮，早上雾大的时候桥洞底下看不太清。' },
  { title: '古戏台 · 春秋', image: 'images/06_ancient_stage.jpg', desc: '古戏台建于清乾隆年间，木结构，顶上的彩绘还剩一些。逢年过节会请戏班来唱戏，平时锁着。' },
  { title: '景月湖 · 夕照', image: 'images/05_lake_sunset.jpg', desc: '景月湖面积约1.8万亩，因湖形弯曲得名。傍晚在东岸看日落角度最好，夏天湖边蚊子多，注意防蚊。' },
  { title: '古镇全景 · 晨雾', image: 'images/01_town_panorama.jpg', desc: '古镇核心区沿河而建，保留明清建筑约47处。早上6点到8点雾最大，拍照的人比较多。' },
  { title: '民国老街 · 旧影', image: 'images/04_old_photo.jpg', desc: '这张照片大约拍摄于1935年前后，石板街当时是镇上最热闹的地方。右边那家布店后来改成了供销社。' },
  { title: '北井 · 千年古井', image: 'images/03_north_well.jpg', desc: '北井位于井湾村北，具体建造年代不详。井圈是青石的，井水常年不干。2003年后井口加了围栏，不允许靠近。' },
  { title: '石板街 · 雨后', gradient: 'linear-gradient(135deg, #b8c9a8, #8aa074)', desc: '古镇核心区的石板街，全长1200米，由数万块青石板铺就。雨后的石板街，泛着温润的光。' },
  { title: '景月书院', gradient: 'linear-gradient(135deg, #9ab2a0, #6a8a7a)', desc: '创建于清康熙年间的景月书院，曾是江南地区著名的书院之一，培养了众多文人学子。' },
  { title: '李状元府', gradient: 'linear-gradient(135deg, #c4b89a, #a08e6a)', desc: '明代状元李文章的府邸，建筑规制宏大，雕饰精美，是江南地区保存最完整的状元府第之一。' },
];

function showGalleryImage(index) {
  const item = galleryData[index];
  if (!item) return;
  document.getElementById('archiveModalTitle').textContent = item.title;
  const media = item.image
    ? `<img src="${item.image}" alt="${item.title}" style="width:100%;max-height:400px;object-fit:cover;border-radius:4px;margin-bottom:16px;">`
    : `<div style="width:100%;height:200px;background:${item.gradient};border-radius:4px;margin-bottom:16px;"></div>`;
  document.getElementById('archiveModalBody').innerHTML = `
    ${media}
    <p>${item.desc}</p>
  `;
  openModal('archiveModal');
}

// 填充画廊
function renderGallery(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map((item, i) => {
    const bg = item.image
      ? `background:url('${item.image}') center/cover no-repeat;`
      : `background:${item.gradient};`;
    return `
      <div class="gallery-item" onclick="showGalleryImage(${i})">
        <div class="gallery-img" style="${bg}"></div>
        <div class="gallery-caption">${item.title}</div>
      </div>
    `;
  }).join('');
}

// ========== 档案数据 ==========
const archiveData = [
  {
    title: '景月镇志（1988版）',
    content: `<p>《景月镇志》编纂工作始于1985年，历时三年完成，是景月镇第一部社会主义新方志。</p>
    <p>全书十二篇约30万字，记述了景月镇自然、政治、经济、文化等方面的情况。</p>
    <h4>目 录（节选）</h4>
    <p>第一篇 建置沿革 &nbsp; 第二篇 自然地理 &nbsp; 第三篇 人口 &nbsp; 第四篇 农业</p>
    <p>第五篇 工业 &nbsp; 第六篇 商业 &nbsp; 第七篇 交通邮电 &nbsp; 第八篇 文化教育</p>
    <p>第九篇 医药卫生 &nbsp; 第十篇 社会 &nbsp; 第十一篇 人物 &nbsp; 第十二篇 大事记</p>
    <p style="color:var(--text-muted);font-style:italic;margin-top:16px;">
      （注：本志记事下限为1987年。2003年重大事件记载见修订本——但修订本从未公开发行。）
    </p>`
  },
  {
    title: '民国时期老照片集',
    content: `<p>本集收录民国时期（1912-1949）景月镇老照片86张，由收藏家陈某某家属捐赠。</p>
    <h4>部分照片目录：</h4>
    <p>• 月牙桥全景（1928年）&nbsp;&nbsp;• 景月书院师生合影（1932年）</p>
    <p>• 古镇集市（1935年）&nbsp;&nbsp;• 景月湖渔船（1936年）</p>
    <p>• 北井庙会（1947年）&nbsp;&nbsp;• 古戏台演出（1948年）</p>
    <h4>特别说明</h4>
    <p>照片集第47号"北井老照片"因画面内容较为模糊，具体年代有待考证。照片中井口旁似乎有...难以辨认的人影。</p>`
  },
  {
    title: '明清古建筑测绘图',
    content: `<p>本图集为1995年省古建筑研究院对古镇核心区明清建筑测绘后编制。</p>
    <p>收录古建筑47处，其中明代8处、清代39处。</p>
    <h4>重点保护建筑：</h4>
    <p>1. 月牙桥 — 明万历年间建，单孔石拱桥，全长32米</p>
    <p>2. 古戏台 — 清乾隆年间建，重檐歇山顶，面阔三间</p>
    <p>3. 李状元府 — 明正德年间建，三路五进建筑</p>
    <p>4. 景月书院 — 清康熙年间建，含讲堂、藏书楼等</p>
    <p>5. 北井井亭 — 明代建，六角井亭，覆盖千年古井</p>
    <p style="color:var(--text-muted);font-style:italic;margin-top:16px;">
      （北井的建造年代在学术界有争议。有学者认为井的历史可追溯到宋代甚至更早。
      当地传说中，这口井"通着另一个地方"。）
    </p>`
  },
  {
    title: '景月书院古籍目录',
    content: `<p>景月书院藏书楼最盛时藏书三万余卷，历经战乱，现存约八千册。</p>
    <h4>馆藏善本（节选）：</h4>
    <p>• 《景月八景诗》 — 清乾隆年间刻本</p>
    <p>• 《井中记》 — 明万历年间抄本，作者不详，记述景月镇北井的"异闻"</p>
    <p>• 《李氏家谱》 — 清同治年间修，状元李文章家族族谱</p>
    <p>• 《景月水利志》 — 清道光年间刻本，记载镇内水系变迁</p>
    <h4>《井中记》摘录：</h4>
    <p style="font-style:italic;color:var(--text-secondary);">
      "镇北有井，不知何年所凿。其水甘冽，终年不涸。井深不可测，乡人有垂绳探之者，绳尽而不及底。
      传说井下有房子，住的不是人。每逢大旱，井中隐隐有乐声出，三日后必有雨。
      万历十七年，井中有物出，状如巨鱼，夜出昼隐，月余乃去。
      （后页缺失）"
    </p>`
  },
  {
    title: '【已解锁】2003年特殊档案 · 景月湖异常事件调查',
    content: `<p style="color:var(--gov-red);font-weight:bold;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gov-red)" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>档案等级：机密</p>
    <p style="color:var(--text-muted);">档案编号：JYZ-2003-SW-0714</p>
    <hr style="margin:16px 0;border-color:var(--border-color);">
    <h4>景月湖"7·14"异常事件初步调查报告</h4>
    <p><strong>报告日期：</strong>2003年7月18日</p>
    <p><strong>调查单位：</strong>景月镇应急指挥部（临时）</p>
    <h4>一、事件概述</h4>
    <p>2003年7月14日凌晨2时17分，景月镇北片（主要是井湾村周边）发生地下水异常喷涌现象。
    据目击者称，北井方向先传来闷响，随后地下水从井口及周边地缝涌出，水量极大，持续约4小时后逐渐消退。</p>
    <p>此次异常喷涌导致景月湖水位短时间内上涨1.7米，淹没了北片部分农田和居民点。
    <strong>与外界普遍认知不同，此次灾害并非由降雨引发的"洪水"——当天气象站记录的降雨量仅为8毫米。</strong></p>
    <h4>二、水样检测</h4>
    <p>喷涌后抽取的井水及湖水样本，检测发现以下异常：</p>
    <p>1. 水色呈淡乳白色，阳光下有微弱荧光反应；</p>
    <p>2. pH值为8.6，偏碱性，含多种未知矿物质成分；</p>
    <p>3. 样本中检测到一种未知的微生物结构，与已知任何物种均不匹配；</p>
    <p>4. <span class="strikethrough">（此段内容被划去，字迹无法辨认）</span></p>
    <h4>三、人员情况</h4>
    <p>直接因灾害受伤23人，失踪<strong>7人</strong>（官方对外公布为3人）。
    失踪者均为井湾村居民，且事发时均报告"在井边"或"听到井里有人叫他们"。</p>
    <p>灾害发生后一周内，镇内陆续出现居民"失忆"或"记忆错乱"的报告，
    主要表现为：记不清灾害发生当天的具体情况、对亲友的记忆出现模糊、甚至对自己的身份产生短暂困惑。</p>
    <h4>四、后续措施</h4>
    <p>1. 对外统一口径为"百年一遇特大暴雨引发山洪"；</p>
    <p>2. 北井及周边区域划为"地质灾害危险区"，禁止居民靠近；</p>
    <p>3. <span class="strikethrough">（以下内容被整张涂黑）</span></p>
    <p>5. 建议上级部门介入调查。</p>
    <div style="margin-top:20px;padding:12px;background:#fff0f0;border-left:4px solid var(--gov-red);font-size:13px;">
      <strong style="color:var(--gov-red);">调查员手记：</strong>
      <p style="margin-top:6px;text-indent:0;">
        我在井边待了三天。我听到了——井底下有声音。<br>
        不是水流的声音。是人的声音。很多人。<br>
        他们在说话，但听不清说什么。<br>
        第二天晚上，我梦见自己在水里，周围全是人，他们都在往下沉，但脸上带着微笑。<br>
        第三天，我记不清我叫什么名字了。<br><br>
        ——调查员：陈XX（三个月后从镇政府辞职，下落不明）
      </p>
    </div>`
  },
];

function showArchive(index) {
  const archive = archiveData[index];
  if (!archive) return;
  document.getElementById('archiveModalTitle').textContent = archive.title;
  document.getElementById('archiveModalBody').innerHTML = archive.content;
  openModal('archiveModal');
}

function showLockedArchive() {
  if (GAME_STATE.discoveries.archive_2003) {
    showArchive(4);
    return;
  }
  openModal('passwordModal');
  setTimeout(() => {
    document.querySelector('.password-digit').focus();
  }, 100);
}

// ========== 密码锁 ==========
function moveToNext(input, index) {
  if (input.value.length === 1 && index < 3) {
    const next = document.querySelectorAll('.password-digit')[index + 1];
    if (next) next.focus();
  }
}

function checkPassword() {
  const digits = document.querySelectorAll('.password-digit');
  const pwd = Array.from(digits).map(d => d.value).join('');
  // 密码是 0714（2003年洪水日期：7月14日）
  if (pwd === '0714') {
    document.getElementById('passwordError').textContent = '';
    closeModal('passwordModal');
    discoverHidden('archive_2003');
    setTimeout(() => showArchive(4), 500);
  } else {
    const errorEl = document.getElementById('passwordError');
    errorEl.textContent = '密码错误，请重试';
    digits.forEach(d => d.value = '');
    digits[0].focus();
  }
}

// ========== 论坛系统 ==========
const forumBoards = {
  life: { title: '民生生活', threads: [
    { id:1, title:'镇东头那家早点铺现在还开着吗？', author:'老陈头', time:'2024-03-15 09:23', views:342, replies:18 },
    { id:2, title:'请问大家水费都是在哪里交的？', author:'新居民小李', time:'2024-03-14 16:45', views:256, replies:12 },
    { id:3, title:'景月湖边上的公园能不能加个健身器材啊', author:'晨练的王阿姨', time:'2024-03-13 07:30', views:189, replies:7 },
    { id:4, title:'最近镇上的野猫好像多了很多...', author:'怕猫的人', time:'2024-03-12 22:10', views:421, replies:25 },
    { id:5, title:'有没有人知道井湾村那边为什么封了？', author:'路过的村民', time:'2024-03-10 14:55', views:678, replies:34 },
    { id:6, title:'镇上哪里能配到老式的那种铜钥匙？', author:'老周', time:'2024-03-08 11:20', views:145, replies:6 },
    { id:7, title:'昨晚又听到奇怪的声音了，有没有人也听到', author:'失眠的人', time:'2024-03-06 03:42', views:534, replies:41 },
    { id:8, title:'镇卫生院的中医馆开了吗？想去看看', author:'养生达人', time:'2024-03-04 10:15', views:198, replies:9 },
  ]},
  tour: { title: '旅游交流', threads: [
    { id:1, title:'求一份两日游攻略！', author:'上海来的游客', time:'2024-03-15 10:30', views:789, replies:32 },
    { id:2, title:'古镇夜游值不值得去？', author:'背包客阿明', time:'2024-03-14 20:15', views:543, replies:28 },
    { id:3, title:'拍照最佳机位分享', author:'摄影师小李', time:'2024-03-13 14:00', views:1234, replies:56 },
    { id:4, title:'请问井湾村可以去吗？导航导不过去', author:'杭州游客', time:'2024-03-11 09:30', views:432, replies:15 },
    { id:5, title:'镇上哪家面馆比较地道？求推荐', author:'吃货小王', time:'2024-03-09 12:45', views:678, replies:43 },
    { id:6, title:'夜游的时候迷路了，走到了一个很偏的地方', author:'迷路的游客', time:'2024-03-07 23:10', views:891, replies:67 },
  ]},
  culture: { title: '文史天地', threads: [
    { id:1, title:'讨论：景月镇名的真正由来', author:'文史爱好者', time:'2024-03-10 19:45', views:876, replies:42 },
    { id:2, title:'【整理】古镇上那些被遗忘的老建筑', author:'老景月人', time:'2024-03-08 08:30', views:1234, replies:67 },
    { id:3, title:'有没有人听过"井里的人"的传说？', author:'好奇的猫', time:'2024-03-05 23:10', views:654, replies:38 },
    { id:4, title:'景月书院古籍整理随笔', author:'书院管理员', time:'2024-03-02 15:20', views:432, replies:21 },
    { id:5, title:'2003年的洪水到底有多大？', author:'90后镇民', time:'2024-02-28 11:05', views:2341, replies:89 },
    { id:6, title:'我爷爷说他年轻时在北井看到过...', author:'井湾村后人', time:'2024-02-25 20:30', views:1567, replies:112 },
    { id:7, title:'民国《景月报》里的一些奇怪记载', author:'旧报收藏者', time:'2024-02-20 16:40', views:987, replies:54 },
    { id:8, title:'镇上的老戏台最后一次唱戏是什么时候？', author:'戏迷老张', time:'2024-02-15 14:20', views:543, replies:28 },
    { id:9, title:'关于景月湖底的那个传说', author:'湖边长大的', time:'2024-02-10 21:15', views:1234, replies:76 },
  ]},
  lost: { title: '寻人寻物', threads: [
    { id:1, title:'寻找丢失的黑色钱包', author:'失主小刘', time:'2024-03-14 18:20', views:156, replies:3 },
    { id:2, title:'谁家的猫？跑到我家来了', author:'爱心人士', time:'2024-03-13 09:10', views:234, replies:8 },
    { id:3, title:'寻找走失的母亲，72岁，有轻微痴呆', author:'焦急的儿子', time:'2024-03-11 08:00', views:1234, replies:56 },
    { id:4, title:'有没有人见过一个穿灰夹克的男人', author:'匿名', time:'2024-03-08 22:30', views:432, replies:12 },
    { id:5, title:'丢了一串钥匙，上面有个铜制的小挂件', author:'马虎的人', time:'2024-03-05 15:40', views:178, replies:4 },
    { id:6, title:'寻人：井湾村的老陈头，三天没见了', author:'老街坊', time:'2024-02-28 19:20', views:876, replies:45 },
  ]},
};

const threadContents = {
  'culture-3': {
    title: '有没有人听过"井里的人"的传说？',
    posts: [
      { author:'好奇的猫', time:'2024-03-05 23:10', avatar:'好', color:'#4a8b7a', content:'小时候我奶奶跟我说过，说北井底下住着人，不让我靠近。\n\n那时候以为是吓小孩的，后来跟同学聊起来发现好多人家里老人都这么说。\n\n有没有人知道这个说法是哪来的？' },
      { author:'老景月人', time:'2024-03-05 23:35', avatar:'老', color:'#8b4513', content:'听过。井湾村那边的老人基本都知道点。\n\n说那口井不能盯着看太久，看久了会看到东西。具体看到什么没人愿意细说。\n\n03年发大水之后就没人提了，好像集体忘了这茬。' },
      { author:'90后镇民', time:'2024-03-06 00:12', avatar:'9', color:'#2c3e50', content:'03年到底咋回事？我那时候上小学，就记得被送到外婆家住了几天，回来家里墙皮都泡掉了。\n\n我爸妈一直说是洪水，但我后来查了那天的天气，根本没下大雨。' },
      { author:'月亮的背面', time:'2024-03-06 08:45', avatar:'月', color:'#6a5acd', content:'回复 90后镇民：\n你也觉得不对？' },
      { author:'90后镇民', time:'2024-03-06 09:20', avatar:'9', color:'#2c3e50', content:'回复 月亮的背面：\n说不上来。就是感觉少了点什么。\n\n我小时候有个邻居家的小孩跟我一起玩的，后来突然就没了。我问我妈，我妈说咱家隔壁一直住的是张叔，没什么小孩。\n\n但我真的记得有那么个人。' },
      { author:'井湾村的老人', time:'2024-03-06 15:30', avatar:'井', color:'#2a5a3a', content:'我井湾村的，今年78。\n\n03年那天晚上根本没下雨。井水自己翻上来的，白花花的，还发光。\n\n水退了以后少了7个人，不是3个。我数过。\n\n我老伴也是那时候没的。但我现在想不起她长什么样了。怎么想都想不起来。' },
      { author:'管理员', time:'2024-03-06 16:00', avatar:'管', color:'#c41e3a', content:'该帖存在不实信息，已关闭回复。\n\n请大家不信谣不传谣，03年是暴雨引发的山洪，气象部门有记录。' },
      { author:'', time:'2024-03-06 23:47', avatar:'?', color:'#333', content:'往下看。\n\n井里。\n\n他们都在井里。\n\n你记住了就别忘。忘了就真没了。\n\n2003.07.16 井湾村' },
    ]
  },
  'culture-5': {
    title: '2003年的洪水到底有多大？',
    posts: [
      { author:'90后镇民', time:'2024-02-28 11:05', avatar:'9', color:'#2c3e50', content:'最近翻老照片看到03年发水的照片，但我记忆里好像没那么严重？\n\n那时候上小学，就停了几天课，感觉很快就过去了。有没有经历过的说说？' },
      { author:'老陈头', time:'2024-02-28 11:30', avatar:'老', color:'#8b4513', content:'雨下了三天三夜，景月湖都漫出来了，北片淹得厉害。\n\n不过救灾来得快，个把礼拜就恢复了。' },
      { author:'月亮的背面', time:'2024-02-28 12:15', avatar:'月', color:'#6a5acd', content:'三天三夜？\n\n我查了气象记录，7月14号前后三天降雨量加起来不到30毫米。\n\n30毫米什么概念，中雨水平。能淹成那样？' },
      { author:'老陈头', time:'2024-02-28 12:40', avatar:'老', color:'#8b4513', content:'回复 月亮的背面：\n是吗...那可能是我记错了。\n\n年头太久了，记不清了。' },
      { author:'井湾村的老人', time:'2024-02-28 14:22', avatar:'井', color:'#2a5a3a', content:'不是下雨。\n\n是井里的水。从北井涌出来的。\n\n我就在边上，我看见了。' },
      { author:'管理员', time:'2024-02-28 16:00', avatar:'管', color:'#c41e3a', content:'请理性讨论，不要传播没有根据的说法。' },
    ]
  },
  'culture-1': {
    title: '讨论：景月镇名的真正由来',
    posts: [
      { author:'文史爱好者', time:'2024-03-10 19:45', avatar:'文', color:'#b8860b', content:'一直有个疑问：景月镇真的是因为景月湖得名的吗？\n\n镇志上说"因镇西有湖名景月"，但南宋的地方志里湖名写的是"镜月"，镜子的镜。镇名一直是"景月"。\n\n如果因湖得名，应该叫镜月镇才对。' },
      { author:'老景月人', time:'2024-03-10 20:30', avatar:'老', color:'#8b4513', content:'我听过另一个说法，说"景月"其实是"井月"——井里的月亮。\n\n说的就是北井，井水清，晚上月亮照在井里特别亮。\n\n不过一个镇以一口井命名也太离谱了。' },
      { author:'月亮的背面', time:'2024-03-10 22:15', avatar:'月', color:'#6a5acd', content:'反过来想呢？\n\n不是镇因湖得名，是湖因镇得名。镇因井得名。\n\n景月→井月→井中之月。\n\n那口井可能比镇子还老。' },
    ]
  },
};

let currentBoard = '';

function enterForumBoard(boardKey) {
  currentBoard = boardKey;
  const board = forumBoards[boardKey];
  if (!board) return;
  document.getElementById('boardTitle').textContent = board.title;
  const listEl = document.getElementById('forumThreadList');
  listEl.innerHTML = board.threads.map((t, i) => `
    <div style="padding:14px 20px;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.2s;" onclick="openThread('${boardKey}', ${i})" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
      <div style="font-size:14px;color:var(--text-primary);margin-bottom:4px;">${t.title}</div>
      <div style="font-size:12px;color:var(--text-muted);">${t.author} · ${t.time} · 回复 ${t.replies} · 浏览 ${t.views}</div>
    </div>
  `).join('');
  document.getElementById('forumMain').style.display = 'none';
  document.getElementById('forumBoard').style.display = 'block';
  document.getElementById('forumThreadView').style.display = 'none';
}

function backToForum() { window.location.href = 'forum.html'; } function _backToForumOld() {
  document.getElementById('forumMain').style.display = 'block';
  document.getElementById('forumBoard').style.display = 'none';
  document.getElementById('forumThreadView').style.display = 'none';
}

function backToBoard() {
  document.getElementById('forumThreadView').style.display = 'none';
  document.getElementById('forumBoard').style.display = 'block';
}

function openThread(boardKey, threadIndex) {
  const board = forumBoards[boardKey];
  const thread = board.threads[threadIndex];
  const key = `${boardKey}-${thread.id}`;
  const content = threadContents[key];

  let posts, title;

  if (content) {
    title = content.title;
    const isSecretThread = (key === 'culture-3');
    if (isSecretThread && !GAME_STATE.discoveries.forum_secret) {
      posts = content.posts.filter((p, i) => i < content.posts.length - 1);
      setTimeout(() => {
        discoverHidden('forum_secret');
        renderThreadPosts(content.posts);
      }, 2000);
    } else {
      posts = content.posts;
    }
  } else {
    title = thread.title;
    posts = [
      { author: thread.author, time: thread.time, avatar: thread.author.charAt(0), color: '#4a8b7a', content: thread.title + '\n\n（本帖为模拟内容，欢迎玩家探索其他带有线索的帖子）' },
      { author: '热心居民', time: '2024-03-15 10:00', avatar: '热', color: '#8b4513', content: '帮顶！' },
    ];
  }

  document.getElementById('threadTitle').textContent = title;
  document.getElementById('forumMain').style.display = 'none';
  document.getElementById('forumBoard').style.display = 'none';
  document.getElementById('forumThreadView').style.display = 'block';
  renderThreadPosts(posts);
}

function renderThreadPosts(posts) {
  const postsEl = document.getElementById('threadPosts');
  postsEl.innerHTML = `
    <div style="padding:10px 20px;background:#f5f5f0;border-bottom:1px solid #eee;font-size:12px;color:var(--text-muted);">
      <span onclick="backToBoard()" style="cursor:pointer;color:var(--link-color);">← 返回版块</span>
    </div>
  ` + posts.map(post => `
    <div style="padding:16px 20px;border-bottom:1px dashed #eee;display:flex;gap:14px;">
      <div style="width:44px;height:44px;border-radius:50%;background:${post.color || '#4a8b7a'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;color:#fff;">${post.avatar || '?'}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:${post.color || 'var(--link-color)'};margin-bottom:6px;">${post.author}</div>
        <div style="font-size:14px;line-height:1.7;color:var(--text-primary);white-space:pre-wrap;">${post.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">${post.time}</div>
      </div>
    </div>
  `).join('');
}

// ========== 隐藏线索详情 ==========
function showWellLocationInfo() {
  const modal = document.getElementById('archiveModal');
  document.getElementById('archiveModalTitle').textContent = '地图 · 西北角的标记';
  document.getElementById('archiveModalBody').innerHTML = `
    <p>你在地图的西北角发现了一个不起眼的小红点。</p>
    <p>那个位置在井湾村的更北边，靠近山脚。地图上没有标注任何地名。</p>
    <p>但你仔细看了很久——那个点的位置，似乎正好是传说中"北井"所在的方位。</p>
    <div style="margin:20px 0;padding:16px;background:#fff0f0;border-left:3px solid var(--gov-red);font-size:13px;">
      为什么地图上有一个没有名字的标记？<br>
      为什么政府官网的地图上，会标出一口古井的位置？<br>
      而且...那个标记的颜色，和其他的都不一样。
    </div>
    <p style="color:var(--text-muted);font-size:12px;">
      （提示：页脚的友情链接里，好像有一个奇怪的链接）
    </p>
  `;
  openModal('archiveModal');
}

function showPhoneEasterEgg() {
  showToast('你拨打了旅游咨询电话...电话里只有忙音。这个号码似乎并不存在。', true);
}

// ========== 结局系统 ==========
function triggerJumpScare() {
  var overlay = document.getElementById('jumpScareOverlay');
  var choiceOverlay = document.getElementById('endingChoiceOverlay');
  if (!overlay) return;

  // 显示红字突脸
  overlay.classList.add('active', 'jump-scare-flash');
  document.body.style.overflow = 'hidden';

  // 3秒后隐藏突脸，显示结局选择
  setTimeout(function() {
    overlay.classList.remove('active');
    setTimeout(function() {
      if (choiceOverlay) {
        choiceOverlay.classList.add('active');
      }
      document.body.style.overflow = '';
    }, 500);
  }, 3000);
}

function ending(type) {
  GAME_STATE.ending = type;
  saveProgress();

  // 隐藏结局选择弹窗
  var choiceOverlay = document.getElementById('endingChoiceOverlay');
  if (choiceOverlay) choiceOverlay.classList.remove('active');

  const screen = document.getElementById('endingScreen');
  const titleEl = screen.querySelector('.ending-title');
  const textEl = screen.querySelector('.ending-text');

  screen.style.display = 'flex';

  const endings = {
    stay: {
      title: '结局 A · 沉沦',
      text: `<p>你跳了下去。</p>
      <p>水比想象中暖。你一直往下沉，没有到底。</p>
      <p>下面有光。不是灯光，是一种发白的、浑浊的光。光里有人影，很多，站着，不动。</p>
      <p>其中一个转过身来。你看不清脸，但它朝你伸出了手。</p>
      <p style="margin-top:30px;color:#888;">
        后来井湾村多了一户人家。没人记得他们是什么时候搬来的，但所有人都觉得他们一直在这里。<br><br>
        户口本上有你的名字。照片上的人你不认识，但邻居说那就是你。
      </p>
      <p style="margin-top:40px;color:#555;font-size:12px;">
        【发现进度：${getTotalProgress()}%】
      </p>`
    },
    leave: {
      title: '结局 B · 逃离',
      text: `<p>你转身就跑。</p>
      <p>你没回头，一直跑到大路上，拦了辆车去县城。到县城的时候天刚亮，你在车站坐了两个小时，买了张去外地的票。</p>
      <p style="margin-top:30px;color:#888;">
        之后你再没去过景月镇。<br><br>
        你试过在地图上搜这个地方，搜不到。你跟别人提起，没人听说过这个镇。你甚至不确定它是不是真的存在过。<br><br>
        但偶尔半夜醒来，你会听到有人在叫你的名字。声音从很远的地方传来，像是从井底。
      </p>
      <p style="margin-top:40px;color:#555;font-size:12px;">
        【发现进度：${getTotalProgress()}%】
      </p>`
    },
    truth: {
      title: '结局 C · 真相',
      text: `<p>你站在井边，把你知道的名字一个一个说了出来。</p>
      <p>调查员的名字。失踪者的名字。井湾村老人的老伴的名字。那些被从记录里抹掉、从记忆里挖走的人。</p>
      <p>井水开始翻涌，白色的光从井底亮起来。你听到声音，很多人的声音，不是说话，更像是叹气。</p>
      <p>然后光灭了。水面恢复了平静，黑得像什么都没发生过。</p>
      <p style="margin-top:30px;color:#888;">
        第二天，有人在镇政府门口放了一份材料，是2003年事件的调查报告复印件。<br><br>
        县里来了人。北井被挖开了，井底没有别的东西，只有淤泥和几块碎石头。<br><br>
        失踪者的名字被重新刻在了井湾村的碑上。老人们开始说起一些他们以为已经忘掉的事。<br><br>
        事情没有完全解决。但至少，有人记得了。
      </p>
      <p style="margin-top:40px;color:#aa6666;font-size:12px;">
        【发现进度：${getTotalProgress()}%】
      </p>
      <p style="color:#666;font-size:11px;margin-top:10px;">
        真结局 · 感谢游玩
      </p>`
    },
  };

  const ending = endings[type];
  titleEl.textContent = ending.title;
  textEl.innerHTML = ending.text;
}

function restartGame() {
  localStorage.removeItem('jingyue_save');
  Object.keys(GAME_STATE.discoveries).forEach(k => GAME_STATE.discoveries[k] = false);
  GAME_STATE.fearLayer = 0;
  GAME_STATE.ending = null;
  document.getElementById('endingScreen').style.display = 'none';
  document.body.classList.remove('layer-1','layer-2','layer-3','layer-4');
  document.querySelectorAll('.hidden-link.found').forEach(el => el.classList.remove('found'));
  updateProgressHUD();
  window.location.href = 'home.html';
  showToast('存档已清除。');
}

// ========== 搜索功能 ==========
function handleSearch() {
  const query = document.getElementById('siteSearch').value.trim();
  if (!query) { showToast('输入关键词'); return; }
  if (query.includes('井') && !GAME_STATE.discoveries.well_location) {
    discoverHidden('well_location');
    return;
  }
  if (query.includes('2003')) {
    showToast('搜索结果：找到 1 条相关档案（需要查阅权限）', true);
    return;
  }
  if (query.includes('失踪') || query.includes('消失')) {
    showToast('搜索结果：未找到相关内容', true);
    return;
  }
  showToast(`搜索"${query}"：共找到 0 条结果`);
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
  // 加载存档
  loadProgress();
  // 强制隐藏结局画面（防止刷新后残留）
  document.getElementById('endingScreen').style.display = 'none';
  updateProgressHUD();

  // 填充首页新闻列表
  const homeNews = document.getElementById('homeNewsList');
  if (homeNews) {
    homeNews.innerHTML = newsData.slice(0, 6).map((n, i) => `
      <li onclick="showNews(${i})">
        <span class="news-title">${n.title}</span>
        <span class="news-date">${n.date.substring(5)}</span>
      </li>
    `).join('');
  }

  // 填充画廊
  renderGallery('homeGallery', galleryData.slice(0, 6));
  renderGallery('cultureGallery', galleryData);

  // 检查真相按钮是否应该显示
  if (GAME_STATE.discoveries.found_all_clues) {
    const truthBtn = document.getElementById('truthBtn');
    if (truthBtn) truthBtn.style.display = 'inline-block';
  }

  // 搜索框回车
  document.getElementById('siteSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSearch();
  });

  // 隐藏链接点击事件 - 发现隐藏链接线索
  document.querySelectorAll('.hidden-link').forEach(link => {
    link.addEventListener('click', function() {
      if (!GAME_STATE.discoveries.hidden_link) {
        discoverHidden('hidden_link');
      }
    });
  });

  console.log('%c景月镇人民政府官网 v2.1', 'color:#c41e3a;font-size:16px;font-weight:bold;');
  console.log('%c维护者：镇信息化办公室', 'color:#999;');
  console.log('%c最后更新：2024-03-01', 'color:#999;');
  console.log(' ');
  console.log('%c提示：仔细查看每一个页面，留意那些看起来"不对劲"的地方。', 'color:#666;font-style:italic;');
  console.log('%c线索可能藏在文字里、图片里、源代码里...或者你想不到的地方。', 'color:#666;font-style:italic;');
  console.log('%c2003档案密码：0714', 'color:#999;font-size:11px;');
});

// ========== Konami彩蛋 ==========
let konamiCode = [];
const secretCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
document.addEventListener('keydown', function(e) {
  konamiCode.push(e.key);
  if (konamiCode.length > secretCode.length) konamiCode.shift();
  if (konamiCode.join(',') === secretCode.join(',')) {
    showToast('输入正确。通往井底的路，已经打开。', true);
    setTimeout(function(){ window.location.href = 'well.html'; }, 1500);
    konamiCode = [];
  }
});