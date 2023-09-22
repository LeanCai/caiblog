# C#帮助工具类

### 1、获取网页内容

```csharp

        /// <summary>
        /// 获取网页内容
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        protected string GetPageContent(string url)
        {
            try
            {
                HttpWebRequest httpReq;
                HttpWebResponse httpResp;
                Uri httpURL = new Uri(url);
                httpReq = (HttpWebRequest)WebRequest.Create(httpURL);
                httpResp = (HttpWebResponse)httpReq.GetResponse();

                //string strBuff = string.Empty;
                //char[] cbuffer = new char[256];
                //int byteRead = 0;
                //Stream respStream = httpResp.GetResponseStream();
                //StreamReader respStreamReader = new StreamReader(respStream, Encoding.UTF8);
                //byteRead = respStreamReader.Read(cbuffer, 0, 256);
                //while (byteRead != 0)
                //{
                //    string strResp = new string(cbuffer, 0, byteRead);
                //    strBuff = strBuff + strResp;
                //    byteRead = respStreamReader.Read(cbuffer, 0, 256);
                //}
                //respStream.Close();
                //return strBuff;

                string result = string.Empty;
                using (var st = httpResp.GetResponseStream())
                {
                    if (st != null)
                    {
                        using (var sr = new StreamReader(st, Encoding.UTF8))
                        {
                            result = sr.ReadToEnd();
                        }
                    }
                }
                return result;
            }
            catch (Exception ex)
            {
                throw ex;
            }

        }

```