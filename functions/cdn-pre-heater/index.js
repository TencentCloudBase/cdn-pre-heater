const https = require("https");
const { CloudApiService } = require("@cloudbase/cloud-api");
/**
 *
 * @param {*} event
 * @returns
 * 通过环境变量输入以下内容
 * PRE_HEAT_CONFIG 格式如下
 * `
 * ${defaultDomain1}/${appId1,${appId2};${defaultDomain2}/${appId1},${appId2}
 * `
 * ``
 */
exports.main = async (event) => {
  const { PRE_HEAT_CONFIG, SECRET_ID, SECRET_KEY } = process.env;
  const pattern = /^[a-zA-Z0-9.-]+.tcloudbaseapp.com\/(app-[a-zA-Z0-9-]+(,app-[a-zA-Z0-9-]+)*)(;[a-zA-Z0-9.-]+.tcloudbaseapp.com\/(app-[a-zA-Z0-9-]+(,app-[a-zA-Z0-9-]+)*))*$/;

  if (!pattern.test(PRE_HEAT_CONFIG)) {
    throw new Error(`请先设置 PRE_HEAT_CONFIG 环境变量，格式为 defaultDomain1/appId1,appId2;defaultDomain2/appId1,appId2 多个规则用分号隔开
    `);
  }

  const cdnService = new CloudApiService({
    service: "cdn",
    credential: {
      secretId: SECRET_ID,
      secretKey: SECRET_KEY,
    },
    version: "2018-06-06",
  });

  return Promise.all(
    PRE_HEAT_CONFIG.split(";").map(async (config) => {
      if (!config) return;
      let preHeatUrls = [];
      const [WEDA_DEFAULT_DOMAIN, WEDA_APP_IDS] = config.split("/");
      preHeatUrls = await getPreHeatUrls(WEDA_DEFAULT_DOMAIN, WEDA_APP_IDS.split(","));
      console.log(WEDA_DEFAULT_DOMAIN, "预热文件数量:", preHeatUrls.length);
      const preHeatResult = await cdnService.request("PushUrlsCache", {
        Urls: preHeatUrls,
      });
      console.log(WEDA_DEFAULT_DOMAIN, "调用预热成功", preHeatResult);
    })
  );
};

async function sleep(time = 3000) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
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
      const manifest = JSON.parse(await fetchData(url));
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
