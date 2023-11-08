# hexo-better-steam

修改了[HCLonely/hexo-steam-games: 为Hexo添加Steam游戏库页面 (github.com)](https://github.com/HCLonely/hexo-steam-games)的插件，使steam数据保存于_data路径下，与其他类似功能插件一致，满足Vercel部署需求。

只有一个账号时：

```yaml
steam:
  enable: true
  steamId: ''
  apiKey: '******'
  path: 
  title: Steam 游戏库
  quote: '来来来，走过路过别错过，有空一起玩游戏~~~'
  tab: all
  length: 1000
  imgUrl: 
  proxy:
    host:
    port:
```

多个账号时：

```yaml
steam:
  enable: true
  apiKey: '728ED49538284B72D8C05B3EE4111748'
  steamInfos: # 多账号配置
    - id: '***' # 主账号
      principal: true
      path: 
    - id: '***' # 分账号
      principal: false
      path: 
      ... # 同单个账号的其他参数
  quote: '来来来，走过路过别错过，有空一起玩游戏~~~'
  tab: all
  length: 1000
  imgUrl: 
  proxy:
    host:
    port:
```

- **enable**: 是否启用

- **apiKey**: Steam 网页 API Key(新版需要API Key才能获取到游戏信息，[点此](https://steamcommunity.com/dev/apikey)注册 API Key)，或者手动获取游戏库数据

- **steamId**: steam 64位Id(需要放在引号里面，不然会有BUG), ***需要将steam库设置为公开！***

- **steamInfos**: 多账号配置

- **path**: 游戏页面路径，默认`steamgames/index.html`

- **title**: 该页面的标题

- **quote**: 写在页面开头的一段话,支持html语法

- **tab**: `all`或`recent`, `all: 所有游戏`, `recent: 最近游玩的游戏`

- **length**: 要显示游戏的数量，游戏太多的话可以限制一下

- **imgUrl**: 图片链接，在`quote`下面放一张图片，图片链接到Steam个人资料，可留空

- proxy

  : 如果无法访问steam社区的话请使用代理

  - **host**: 代理ip或域名
  - **port**: 代理端口

- **extra_options**: 此配置会扩展到Hexo的`page`变量中
