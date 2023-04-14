# CDN PreHeater

基于云函数实现的微搭低代码低频访问应用的性能提升插件

## 准备工作

- **获取微搭应用默认域名**
  - 例如 lowcode-1gxvnos61f22b18b-1311711383.tcloudbaseapp.com
- **需要预热的应用 id**
  - 例如 app-nvzcvt10
- **准备专用的子账号密钥**
  - 需要新建一个腾讯云子账号
  - 允许改账号调用 "cdn:PushUrlsCache" 接口
  - 子账号需要有 API 密钥
  - 具体可参考文档最后的附录：在腾讯云新建 cdn 预热子账号
- **应用正式发布**
  - 确保应用默认域名下存在 weda-manifest.json 文件，路径 `https://${defaultDomain}/${appId}/production/weda-manifest.json}`

## 部署

点击下方按钮使用 [CloudBase Framework](https://github.com/TencentCloudBase/cloudbase-framework) 可以在云端一键部署本项目到自己的云开发账号上。

[![](https://main.qcloudimg.com/raw/67f5a389f1ac6f3b4d04c7256438e44f.svg)](https://console.cloud.tencent.com/tcb/env/index?action=CreateAndDeployCloudBaseProject&appUrl=https%3A%2F%2Fgithub.com%2FTencentCloudBase%2Fcdn-pre-heater&branch=master)

可以选择一个按量计费的云开发环境进行部署，在配置时，按照说明进行配置

![](https://raw.githubusercontent.com/binggg/storage/main/cdn202304131334232.png)

如果没有按量计费的云开发环境，可以在本地进行部署

**下载 CLI 工具**

```bash
npm install -g @cloudbase/cli@latest
tcb login
```

**下载代码包，并在项目根目录执行部署**

注意：-e 参数需要改为微搭的环境 id

```bash
tcb framework deploy -e xxxxx
```

**手动配置预热参数**

参照下面教程进行配置

## 预热配置和修改

部署成功后，后续如果需要添加预热应用/修改预热频率，可以在云开发/云函数中找到 cdn-pre-heater 函数，编辑云函数进行配置

![](https://raw.githubusercontent.com/binggg/storage/main/cdn202304131336529.png)

### 环境变量

- PRE_HEAT_CONFIG
  - 预热配置 格式为 defaultDomain1/appId1,appId2;defaultDomain2/appId1,appId2
  - 参考配置 lowcode-1gxvnos61f22b18b-1311711383.tcloudbaseapp.com/app-jzaQSTEk,app-jzaQSTE1
  - 如果有多个环境，配置用英文分号隔开，例如 lowcode-1gxvnos61f22b18b-1311711383.tcloudbaseapp.com/app-jzaQSTEk,app-jzaQSTE1;lowcode-1gxvnos61f22b18b-1311711383.tcloudbaseapp.com/app-jzaQSTEk,app-jzaQSTE1
- SECRET_ID
  - 子账号 SECRETID，需要有 cdn 的接口权限
- SECRET_KEY
  - 子账号 SECRETKEY，需要有 cdn 的接口权限

### 定时触发配置

默认设置是 `"0 */5 8-20 * * * *"`, 代表每天 8 到 20 点每五分钟执行一次

具体可参考 [云开发云函数定时触发器](https://docs.cloudbase.net/cloud-function/timer-trigger)

## 查看预热日志

同时可以在云函数日志中查看和监控预热的执行情况

![](https://raw.githubusercontent.com/binggg/storage/main/cdn202304131339772.png)

## 附录：在腾讯云新建 cdn 预热子账号

在[腾讯云访问管理](https://console.cloud.tencent.com/cam)中新建子用户，需要支持 API 访问

![](https://raw.githubusercontent.com/binggg/storage/main/cdn202304131322450.png)

选择自定义的 CAM 策略，策略表达式按照下图进行配置

```json
{
  "version": "2.0",
  "statement": [
    {
      "effect": "allow",
      "action": ["cdn:PushUrlsCache"],
      "resource": ["*"]
    }
  ]
}
```

![](https://raw.githubusercontent.com/binggg/storage/main/cdn202304131323698.png)

子账号创建成功后，需要复制一下 SecretId 和 SecretKey

![](https://raw.githubusercontent.com/binggg/storage/main/cdn202304131323038.png)
