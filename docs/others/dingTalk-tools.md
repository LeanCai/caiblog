# 钉钉消息工具类封装


::: tip 钉钉自定义机器人接入

 [钉钉官方文档](https://open.dingtalk.com/document/orgapp/custom-robot-access) 

:::

::: details 查看C#详细代码

**注意引入RestSharp**

```csharp {3}
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;

namespace Common.Utils
{
    /// <summary>
    /// 钉钉自定义机器人消息封装，文档地址：https://open.dingtalk.com/document/orgapp/custom-robot-access
    /// </summary>
    public class DingTalkClient
    {
        List<MsgWebhook> msgWebhooks = new List<MsgWebhook>();
        string _globalSecret;
        public DingTalkClient()
        {
        }
        public DingTalkClient(params string[] webhooks)
        {
            foreach (var item in webhooks)
            {
                msgWebhooks.Add(new MsgWebhook() { webhook = item });
            }
        }
        public DingTalkClient(List<string> webhooks)
        {
            foreach (var item in webhooks)
            {
                msgWebhooks.Add(new MsgWebhook() { webhook = item });
            }
        }
        public DingTalkClient(List<MsgWebhook> webhooks)
        {
            msgWebhooks = webhooks;
        }
        public void SetGlobalSecret(string secret)
        {
            _globalSecret = secret;
        }
        public string GetSign(long timestamp, string secret)
        {
            string stringToSign = timestamp + "\n" + secret;
            string signData = Encrypt(stringToSign, secret);
            string sign = System.Web.HttpUtility.UrlEncode(signData, System.Text.Encoding.UTF8);
            return sign;
        }
        public string Encrypt(string message, string secret)
        {
            secret = secret ?? "";
            var encoding = new System.Text.UTF8Encoding();
            byte[] keyByte = encoding.GetBytes(secret);
            byte[] messageBytes = encoding.GetBytes(message);
            using (var hmacsha256 = new HMACSHA256(keyByte))
            {
                byte[] hashmessage = hmacsha256.ComputeHash(messageBytes);
                return Convert.ToBase64String(hashmessage);
            }
        }
        /// <summary>
        /// DateTime转换为13位时间戳（单位：毫秒）
        /// </summary>
        /// <param name="dateTime"> DateTime</param>
        /// <returns>13位时间戳（单位：毫秒）</returns>
        public long DateTimeToLongTimeStamp(DateTime dateTime)
        {
            DateTime timeStampStartTime = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            return (long)(dateTime.ToUniversalTime() - timeStampStartTime).TotalMilliseconds;
        }
        public string UrlEncode(string url, System.Text.Encoding encoding = null)
        {
            if (encoding == null) { encoding = System.Text.Encoding.UTF8; }
            var res = System.Web.HttpUtility.UrlEncode(url, encoding);
            return res;
        }
        public string BuildMsgUrl(string url, bool pc_slide = true)
        {
            var encodeUrl = UrlEncode(url);
            string res = $"dingtalk://dingtalkclient/page/link?url={encodeUrl}&pc_slide={(pc_slide ? "true" : "false")}";
            return res;
        }
        public string BuildAtText(List<string> phoneNumbers, string separator = ",")
        {
            string text = string.Empty;
            int i = 0;
            foreach (var item in phoneNumbers)
            {
                text += i < phoneNumbers.Count ? $"@{item}{separator}" : $"@{item}";
            }
            return text;
        }
        public List<string> GetWebHooks()
        {
            string globalSign = string.Empty;
            long timestamp = DateTimeToLongTimeStamp(DateTime.Now);
            if (!string.IsNullOrEmpty(_globalSecret))
            {
                globalSign = GetSign(timestamp, _globalSecret);
            }

            List<string> webhooks = new List<string>();
            foreach (var item in msgWebhooks)
            {
                string webhook = item.webhook;
                if (!string.IsNullOrEmpty(item.webhook) && !string.IsNullOrEmpty(globalSign))
                {
                    webhook = $"{item.webhook}&timestamp={timestamp}&sign={globalSign}";
                }
                else if (!string.IsNullOrEmpty(item.webhook) && !string.IsNullOrEmpty(item.secret))
                {
                    string tempSign = GetSign(timestamp, item.secret);
                    webhook = $"{item.webhook}&timestamp={timestamp}&sign={tempSign}";
                }
                webhooks.Add(webhook);
            }

            return webhooks;
        }

        /// <summary>
        /// text 消息
        /// </summary>
        /// <param name="content"></param>
        /// <param name="atMobiles"></param>
        /// <param name="isAtAll"></param>
        /// <returns></returns>
        public ResultModel SendTextMsg(string content, List<string> atMobiles = null, bool? isAtAll = null)
        {
            DingTalkMsg msg = new DingTalkMsg();
            msg.msgtype = MsgType.text;
            msg.text = new TextMsg { content = content };
            if (atMobiles != null || isAtAll.HasValue)
            {
                msg.at = new MsgAt { atMobiles = atMobiles, isAtAll = isAtAll };
            }
            return Send(msg);
        }
        /// <summary>
        /// link 消息
        /// </summary>
        /// <param name="title"></param>
        /// <param name="text"></param>
        /// <param name="messageUrl"></param>
        /// <param name="picUrl"></param>
        /// <returns></returns>
        public ResultModel SendLinkMsg(string title, string text, string messageUrl, string picUrl = null)
        {
            DingTalkMsg msg = new DingTalkMsg();
            msg.msgtype = MsgType.link;
            msg.link = new LinkMsg
            {
                title = title,
                text = text,
                messageUrl = messageUrl,
                picUrl = picUrl,
            };
            return Send(msg);
        }
        /// <summary>
        /// markdown 消息
        /// </summary>
        /// <param name="title"></param>
        /// <param name="text"></param>
        /// <param name="atMobiles"></param>
        /// <param name="isAtAll"></param>
        /// <returns></returns>
        public ResultModel SendMarkdownMsg(string title, string text, List<string> atMobiles = null, bool? isAtAll = null)
        {
            DingTalkMsg msg = new DingTalkMsg();
            msg.msgtype = MsgType.markdown;
            msg.markdown = new MarkdownMsg
            {
                title = title,
                text = text,
            };
            if (atMobiles != null || isAtAll.HasValue)
            {
                msg.at = new MsgAt { atMobiles = atMobiles, isAtAll = isAtAll };
            }
            return Send(msg);
        }
        /// <summary>
        /// actionCard 消息
        /// </summary>
        /// <param name="title"></param>
        /// <param name="text"></param>
        /// <param name="singleTitle"> 单个按钮的标题。 设置此项和singleURL后，btns无效。</param>
        /// <param name="singleURL">点击消息跳转的URL，</param>
        /// <param name="btnOrientation">0：按钮竖直排列,1：按钮横向排列</param>
        /// <param name="btns">按钮。</param>
        /// <returns></returns>
        public ResultModel SendActionCardMsg(string title, string text, string singleTitle, string singleURL, string btnOrientation = "0", List<ActionCardMsgBtn> btns = null)
        {
            DingTalkMsg msg = new DingTalkMsg();
            msg.msgtype = MsgType.actionCard;
            msg.actionCard = new ActionCardMsg
            {
                title = title,
                text = text,
                btnOrientation = btnOrientation,
                singleTitle = singleTitle,
                singleURL = singleURL,
                btns = btns,
            };
            return Send(msg);
        }
        /// <summary>
        /// feedCard 消息
        /// </summary>
        /// <param name="links"> 里面所有项必填</param>
        /// <returns></returns>
        public ResultModel SendFeedCardMsg(List<FeedCardMsgBaseItem> links)
        {
            DingTalkMsg msg = new DingTalkMsg();
            msg.msgtype = MsgType.feedCard;
            msg.feedCard = new FeedCardMsg
            {
                links = links,
            };
            return Send(msg);
        }
        public ResultModel SendMsg(DingTalkMsg msg)
        {
            return Send(msg);
        }
        public ResultModel Send(object bodyParam)
        {
            ResultModel rm = new ResultModel();
            List<string> webhooks = GetWebHooks();
            var setting = new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore };
            var bodyJson = JsonConvert.SerializeObject(bodyParam, setting);
            foreach (var item in webhooks)
            {
                var res = Post(item, bodyJson);
                if (res != null && res.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    var msgRes = JsonConvert.DeserializeObject<MsgResponse>(res.Content);
                    if (!msgRes.success)
                    {
                        rm.success = false;
                        rm.message += $"\n Item({item}) Response:" + res.Content;
                    }
                }
            }
            return rm;
        }
        public IRestResponse Post(string url, string bodyJson)
        {
            var restClient = new RestClient(url);
            IRestRequest restRequest = new RestRequest(Method.POST)
            {
                RequestFormat = DataFormat.Json
            };
            if (!string.IsNullOrEmpty(bodyJson))
            {
                restRequest.AddParameter("application/json", bodyJson, ParameterType.RequestBody);
            }
            var resp = restClient.Execute(restRequest);
            return resp;
        }
        public IRestResponse Post(string url, object bodyParam)
        {
            var restClient = new RestClient(url);
            IRestRequest restRequest = new RestRequest(Method.POST)
            {
                RequestFormat = DataFormat.Json
            };
            if (bodyParam != null)
            {
                //restRequest.AddBody(bodyParam);
                var bodyJson = JsonConvert.SerializeObject(bodyParam);
                restRequest.AddParameter("application/json", bodyJson, ParameterType.GetOrPost);
            }
            var resp = restClient.Execute(restRequest);
            return resp;
        }

        #region 嵌套类
        public class ResultModel
        {
            public bool success { get; set; } = true;

            public string message { get; set; }
        }
        public class MsgResponse
        {
            public string errcode { get; set; }
            public string errmsg { get; set; }
            public bool success => errcode == "0";
        }
        public class MsgWebhook
        {
            public string webhook { get; set; }
            public string secret { get; set; }
        }
        public enum MsgType
        {
            text,
            link,
            markdown,
            actionCard,
            feedCard,
        }
        public class DingTalkMsg
        {
            [JsonConverter(typeof(StringEnumConverter))]
            public MsgType msgtype { get; set; }

            public TextMsg text { get; set; }
            public MsgAt at { get; set; }
            public LinkMsg link { get; set; }
            public MarkdownMsg markdown { get; set; }
            public ActionCardMsg actionCard { get; set; }
            public FeedCardMsg feedCard { get; set; }
        }
        public class MsgAt
        {
            public List<string> atMobiles { get; set; }
            public List<string> atUserIds { get; set; }
            public bool? isAtAll { get; set; }
        }
        public class TextMsg
        {
            public string content { get; set; }
        }
        public class LinkMsg
        {
            public string title { get; set; }
            public string text { get; set; }
            public string messageUrl { get; set; }
            public string picUrl { get; set; }
        }
        public class MarkdownMsg
        {
            public string title { get; set; }
            public string text { get; set; }
        }
        public class ActionCardMsg
        {
            public string title { get; set; }
            public string text { get; set; }
            public string singleTitle { get; set; }
            public string singleURL { get; set; }
            public string btnOrientation { get; set; }
            public List<ActionCardMsgBtn> btns { get; set; }
        }
        public class ActionCardMsgBtn
        {
            public string title { get; set; }
            public string actionURL { get; set; }
        }
        public class FeedCardMsg
        {
            public List<FeedCardMsgBaseItem> links { get; set; }
        }
        public class FeedCardMsgBaseItem
        {
            public string title { get; set; }
            public string messageURL { get; set; }
            public string picURL { get; set; }
        }
        #endregion
    }
}

```
:::

