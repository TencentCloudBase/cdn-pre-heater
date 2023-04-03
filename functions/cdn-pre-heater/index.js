const https = require("https");
/**
 *
 * @param {*} event
 * @returns
 * 通过环境变量输入以下内容
 * WEDA_DEFAULT_DOMAIN 微搭默认域名，例如lowcode-1gxvnos61f22b18b-1311711383.tcloudbaseapp.com
 * WEDA_APP_IDS  自定义应用列表，格式为一个用,号隔开的appid列表
 */
exports.main = async (event) => {
  const {
    WEDA_DEFAULT_DOMAIN,
    WEDA_APP_IDS,
  } = process.env;

  console.log(
    "触发事件",
    Date.now(),
    WEDA_DEFAULT_DOMAIN,
    WEDA_APP_IDS
  );

  if (!WEDA_DEFAULT_DOMAIN) {
    return 
  }

  if (!WEDA_APP_IDS) {
    return
  }

  // 从 WEDA_DEFAULT_DOMAIN/${appId}/production/weda-manifest.json 拉取文件
  const preHeatUrls = await getPreHeatUrls(WEDA_DEFAULT_DOMAIN, WEDA_APP_IDS.split(','));
  console.log("预热文件列表:", preHeatUrls);

  await preHeat(preHeatUrls);
};

/**
 * 预热cdn
 */
async function preHeat(urls) {
  return Promise.all(urls.map(url => {
    return fetchData(url)
        .then(() => {
            console.log('预热成功', url)
        })
        .catch(e => {
            console.log(e.message, url)
        })
  }));
}

/**
 * 获取应用预热列表
 * @returns
 */
async function getPreHeatUrls(defaultDomain, appIds) {
  const urls = [];
  for (const appId of appIds) {
    const url = `https://${defaultDomain}/${appId}/production/weda-manifest.json?v=${Date.now()}`;
    try {
      const manifest =  JSON.parse(await fetchData(url));
      urls.push(...manifest.preHeatUrls);
      console.log("应用", appId, "加入预热列表成功");
    } catch (e) {
      console.log("应用", appId, "加入预热列表失败", e);
    }
  }
  return urls;
}

/**
 * 请求 JSON
 * @param {*} url
 * @returns
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(data);
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
