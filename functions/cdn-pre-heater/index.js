const https = require("https");
const { CloudApiService } = require("@cloudbase/cloud-api");
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
    SECRET_ID,
    SECRET_KEY,
    OTHER_URLS = "",
  } = process.env;

  if (!SECRET_ID || !SECRET_KEY) {
    throw new Error("请提供子账号 API 访问密钥，需要有 CDN 访问权限");
  }

  if (!WEDA_DEFAULT_DOMAIN) {
    throw new Error(
      "请提供微搭应用默认域名，例如lowcode-1gxvnos61f22b18b-1311711383.tcloudbaseapp.com"
    );
  }

  if (!WEDA_APP_IDS) {
    throw new Error("请提供需要预热的微搭 APP ID，用英文逗号隔开");
  }

  let preHeatUrls = OTHER_URLS ? OTHER_URLS.split(",") : [];

  const cdnService = new CloudApiService({
    service: "cdn",
    credential: {
      secretId: SECRET_ID,
      secretKey: SECRET_KEY,
    },
    version: "2018-06-06",
  });

  console.log("定时预热", Date.now(), WEDA_DEFAULT_DOMAIN, WEDA_APP_IDS);

  // 从 WEDA_DEFAULT_DOMAIN/${appId}/production/weda-manifest.json 拉取文件
  preHeatUrls = preHeatUrls.concat(
    await getPreHeatUrls(WEDA_DEFAULT_DOMAIN, WEDA_APP_IDS.split(","))
  );
  console.log("预热文件列表:", preHeatUrls);

  // const purgeResult = await cdnService.request("TcbPurge", {
  //   Urls: preHeatUrls,
  // });

  // console.log("刷新缓存成功", purgeResult);

  // await sleep(5000);

  const preHeatResult = await cdnService.request("PushUrlsCache", {
    Urls: preHeatUrls,
  });

  console.log("调用预热成功", preHeatResult);
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
