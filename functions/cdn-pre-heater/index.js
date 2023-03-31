const https = require("https");
/**
 *
 * @param {*} event
 * @returns
 * 通过环境变量输入以下内容
 * WEDA_CUSTOM_DOMAIN 微搭自定义域名
 * WEDA_DEFAULT_DOMAIN 微搭默认域名，例如lowcode-1gxvnos61f22b18b-1311711383.tcloudbaseapp.com
 * WEDA_CAPP_IDS  自定义应用列表，格式为一个用,号隔开的appid列表
 * WEDA_BAPP_IDS 模型应用列表，格式为一个用,号隔开的appid列表
 */
exports.main = async (event) => {
  const {
    WEDA_CUSTOM_DOMAIN,
    WEDA_DEFAULT_DOMAIN,
    WEDA_CAPP_IDS,
    WEDA_BAPP_IDS,
  } = process.env;

  console.log(
    "触发事件",
    Date.now(),
    WEDA_CUSTOM_DOMAIN,
    WEDA_DEFAULT_DOMAIN,
    WEDA_CAPP_IDS,
    WEDA_BAPP_IDS
  );

  // 从 WEDA_DEFAULT_DOMAIN/${appId}/production/weda-manifest.json 拉取文件
  const customAppUrls = getCustomAppUrl(WEDA_CAPP_IDS);
  const modelAppUrls = getModelAppUrl(WEDA_BAPP_IDS);
  console.log("CAPP URLs:", customAppUrls, modelAppUrls);
  const preHeatUrls = [...customAppUrls, ...modelAppUrls];

  await preHeat(preHeatUrls);
};

/**
 * 预热cdn
 */
async function preHeat(urls) {
  return urls;
}

/**
 * 获取模型应用预热列表
 * @returns
 */
async function getModelAppUrl() {
  const urls = [];
  for (const appId of WEDA_CAPP_IDS) {
    const url = `${WEDA_DEFAULT_DOMAIN}/${appId}/production/weda-manifest.json`;
    try {
      const manifest = await fetchJson(url);
      urls.push(...manifest.url);
      console.log("模型应用", appId, "加入预热列表成功");
    } catch (e) {
      console.log("模型应用", appId, "加入预热列表失败", e);
    }
  }
  return urls;
}

/**
 * 获取自定义应用预热列表
 * @returns
 */
async function getCustomAppUrl() {
  const urls = [];
  for (const appId of WEDA_CAPP_IDS) {
    const url = `${WEDA_DEFAULT_DOMAIN}/${appId}/production/weda-manifest.json`;
    try {
      const manifest = await fetchJson(url);
      urls.push(...manifest.url);
      console.log("自定义应用", appId, "加入预热列表成功");
    } catch (e) {
      console.log("自定义应用", appId, "加入预热列表失败", e);
    }
  }
  return urls;
}

/**
 * 请求 JSON
 * @param {*} url
 * @returns
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}
