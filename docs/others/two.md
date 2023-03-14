# 糟糕的代码

::: details 点击查看代码

```csharp
   private string GetGrossProfitReportWhere()
        {
            string startTime = request.Params["StartTime"];
            string endTime = request.Params["EndTime"];
            string ccids = request.Params["ccids"];

            string tempWhereSql = string.Empty;
            string navyInMonthWhere = string.Empty;
            string navyNotInMonthWhere = string.Empty;
            if (!string.IsNullOrEmpty(startTime) && !string.IsNullOrEmpty(endTime))
            {
                tempWhereSql += @"
                  AND ( ( type = 0
                            AND OrderTime BETWEEN '" + startTime + @"'
                                          AND     '" + endTime + @"'
                          )
                        OR ( type = 1 )
                        OR ( type = 2 )
                        )";
                navyInMonthWhere = string.Format("NavyPaymentDate BETWEEN '{0}' AND  '{1}' AND PurchaseDate NOT BETWEEN '{0}' AND  '{1}'", startTime, endTime);
                navyNotInMonthWhere = string.Format("PurchaseDate BETWEEN '{0}' AND  '{1}' AND NavyPaymentDate NOT BETWEEN '{0}' AND  '{1}'", startTime, endTime);
                _csReturnOrderWhere += " AND CONVERT(datetime,Orders.Bill_Date) BETWEEN '" + startTime + "' AND '" + endTime + "'";
            }
            else if (!string.IsNullOrEmpty(startTime))
            {
                tempWhereSql += @"
                  AND ( ( type = 0
                          AND OrderTime >= '" + startTime + @"'
                          )
                        OR ( type = 1 )
                        OR ( type = 2 )
                        )";
                _csReturnOrderWhere += " AND CONVERT(datetime,Orders.Bill_Date) >= '" + startTime + "'";
                navyInMonthWhere = @"NavyPaymentDate >= '" + startTime + @"' AND PurchaseDate <= '" + startTime + @"'";
                navyNotInMonthWhere = @"PurchaseDate >= '" + startTime + @"' AND NavyPaymentDate <= '" + startTime + @"'";
            }
            else if (!string.IsNullOrEmpty(endTime))
            {
                tempWhereSql += @"
                  AND ( ( type = 0
                          AND OrderTime <= '" + endTime + @"'
                          )
                        OR ( type = 1 )
                        OR ( type = 2 )
                        )";
                _csReturnOrderWhere += " AND CONVERT(datetime,Orders.Bill_Date) <= '" + endTime + "'";
                navyInMonthWhere = @"NavyPaymentDate <= '" + endTime + @"' AND PurchaseDate >= '" + endTime + @"'";
                navyNotInMonthWhere = @"PurchaseDate <= '" + endTime + @"' AND NavyPaymentDate >= '" + endTime + @"'";
            }
            if (!string.IsNullOrEmpty(request.Params["selFulfillmentChannel"]) && request.Params["selFulfillmentChannel"] != "0")
            {
                _sbWhere.Append("and FulfillmentChannel = '" + request.Params["selFulfillmentChannel"] + "'");
            }
            if (!string.IsNullOrEmpty(request.Params["selMarketplace"]) && request.Params["selMarketplace"] != "0")
            {
                //_sbWhere.Append("and MarketplaceId = '" + request.Params["selMarketplace"] + "'");
                x_MarketplaceSiteBLL x_MarketplaceSiteBLL = new x_MarketplaceSiteBLL();
                var xMarketList = x_MarketplaceSiteBLL.GetMarketplaceList();
                var market = xMarketList.FirstOrDefault(x => x.MarketplaceId == request.Params["selMarketplace"]);
                if (market != null)
                {
                    _sbWhere.Append($" and MSiteId ={market.MSiteId} ");
                }
            }
            if (ccids.Length > 0 && ccids != "" && ccids != "-1")
            {
                tempWhereSql += " AND CCID IN (" + ccids + ")";
            }
            string feesFileds = " Commission , ProgramShippingCosts ProgramShippingCosts ,";
            string billAccountSql = string.Empty;
            //使用对账单费用
            if (!string.IsNullOrEmpty(request.Params["selectFees"]) && request.Params["selectFees"].ToString() == "2")
            {
                feesFileds = @" (case when b.CommissionQuantity=Orders.Quantity and b.CommissionQuantity>0 and Orders.Price>0 then (b.CommissionFee/b.CommissionQuantity/Orders.Price) else Commission end)Commission ,--佣金
                                   (case when b.FulfillmentFeeQuantity=Orders.Quantity and b.FulfillmentFeeQuantity>0 then b.FulfillmentFee/b.FulfillmentFeeQuantity else ProgramShippingCosts end) ProgramShippingCosts ,--运费
                                ";
                billAccountSql = @"  LEFT JOIN
                                (
                                " + GetBillAccountSql() + @"
                                ) b on Orders.AmazonOrderId=b.Order_Id AND Orders.SellerSKU=b.SKU ";
            }
            //显示采购成本
            string orderPurchaseCostSql = string.Empty;
            if (!string.IsNullOrEmpty(request.Params["showPurchaseCost"]) && request.Params["showPurchaseCost"].ToString() == "1")
            {
                orderPurchaseCostSql = @"   LEFT JOIN
                                         ec_BaseInfo  on Orders.BID=ec_BaseInfo.BID and ec_BaseInfo.VariationMark in(0,1)
                                         LEFT JOIN
                                         ec_BaseInfoWithCom_Detail
                                         on ec_BaseInfo.BID=ec_BaseInfoWithCom_Detail.BID
                                         LEFT JOIN
                                         Order_Purchase_Cost  on (CAST( Orders.shopID as varchar(5))+'*'+ Orders.AmazonOrderId)=Order_Purchase_Cost.Ebp_Bill_Code and ec_BaseInfoWithCom_Detail.CS_GoodID=Order_Purchase_Cost.Goods_Id";
            }
            string reportGroup = request.Params["ReportGroup[]"] ?? request.Params["ReportGroup"];
            decimal costPriceBase = 1.45m;//默认基数1.45
            try
            {
                costPriceBase = decimal.Parse(request.Params["costPriceType"].ToString());
            }
            catch (Exception ex) { }
            string innerJoinAGBSSql = string.Empty; // 使用AGBS下单时间统计
            string strSpecialFields = string.Empty; // 特殊查询字段
            if (!string.IsNullOrEmpty(request.Params["orderTimeType"]) && request.Params["orderTimeType"].ToString() == "1")
            {
                strSpecialFields += ",Orders_agbs.Bill_Date AS PurchaseDate";
                innerJoinAGBSSql = " INNER JOIN Orders_agbs ON Orders.shopID = Orders_agbs.shopID AND Orders.AmazonOrderId = Orders_agbs.OrderId ";
            }
            else
            {
                strSpecialFields += ",PurchaseDate";
            }
            bool excludeDiscount = request.Params.AllKeys.Contains("ExcludeDiscount") && request.Params["ExcludeDiscount"] == "true" ? true : false;

            // 默认方案及新旧方案成本取值
            string strCostPrice = string.Empty;
            string strOtherFileds = string.Empty;
            string strInitTable = string.Empty;

            int.TryParse(request.Params["schemeType"], out int schemeType);
            switch (schemeType)
            {
                case 0:
                    {
                        strInitTable = " Orders WITH (NOLOCK)";
                        strCostPrice = $@"  CASE WHEN(CASE WHEN TYPE = 0 THEN PurchaseDate ELSE CONVERT(datetime, Orders.Bill_Date) END) >= '2022-07-01 00:00:00'

                                                    THEN
                                                    (
                                                        CASE WHEN TYPE = 1
                                                            THEN CostPrice * (CASE WHEN OrderType IN (2,3) THEN 1 ELSE 0.25 END)
                                                            ELSE CostPrice
                                                            END
                                                    )

                                                    ELSE
                                                    (CASE WHEN DATEPART(YEAR, (CASE WHEN TYPE = 0 THEN PurchaseDate ELSE Orders.Bill_Date END)) > 2019

                                                        THEN CostPrice * 1.45 ELSE CostPrice * 1.75

                                                        END) /{ costPriceBase }
                                        END";

                        strOtherFileds = $@" ,(CASE WHEN(CASE WHEN TYPE = 0 THEN PurchaseDate ELSE CONVERT(datetime, Orders.Bill_Date) END) >= '2022-07-01 00:00:00'

                                                    THEN
                                                    (
                                                        CASE WHEN OrderType IN (2,3,4)
							                                            THEN 0
							                                            ELSE OrderRemovalFee * ExchangeRate
							                                            END
                                                    )
                                                    ELSE OrderRemovalFee * ExchangeRate
                                                END) AS OrderRemovalFee";
                    }
                    break;
                case 1:
                case 2:
                    {
                        strInitTable = schemeType == 1 ? " OrdersWithP5 AS Orders WITH (NOLOCK)" : " OrdersWithP3 AS Orders WITH (NOLOCK)";
                        strCostPrice = schemeType == 1
                            // 旧方案（E价成本/1.75），20220701之前使用系统已有成本，之后使用当前账套实时成本
                            ? $@"  CASE WHEN(CASE WHEN TYPE = 0 THEN PurchaseDate ELSE CONVERT(datetime, Orders.Bill_Date) END) >= '2022-07-01 00:00:00'

                                                    THEN
                                                    (
                                                       NewCostPrice / { costPriceBase }
                                                    )

                                                    ELSE
                                                    (CASE WHEN DATEPART(YEAR, (CASE WHEN TYPE = 0 THEN PurchaseDate ELSE Orders.Bill_Date END)) > 2019

                                                        THEN CostPrice * 1.45 ELSE CostPrice * 1.75

                                                        END) /{ costPriceBase }
                                        END"
                                        // 新方案（C价成本），20220701之前当前账套实时成本，之后使用使用系统已有成本
                                        : $@"  CASE WHEN(CASE WHEN TYPE = 0 THEN PurchaseDate ELSE CONVERT(datetime, Orders.Bill_Date) END) >= '2022-07-01 00:00:00'

                                                    THEN
                                                    (
                                                        CASE WHEN TYPE = 1
                                                            THEN CostPrice * (CASE WHEN OrderType IN (2,3) THEN 1 ELSE 0.25 END)
                                                            ELSE CostPrice
                                                            END
                                                    )

                                                    ELSE
                                                    (
                                                        CASE WHEN TYPE = 1
                                                            THEN NewCostPrice * (CASE WHEN OrderType IN (2,3) THEN 1 ELSE 0.25 END)
                                                            ELSE NewCostPrice
                                                            END
                                                    )
                                        END";

                        strOtherFileds = schemeType == 1 ? $@" ,OrderRemovalFee * ExchangeRate AS OrderRemovalFee"
                                                         : $@" , (
						                                            CASE WHEN OrderType IN (2,3,4)
							                                            THEN 0
							                                            ELSE OrderRemovalFee * ExchangeRate
							                                            END
						                                            ) AS OrderRemovalFee";
                    }
                    break;
                default: break;
            }

            string strSql = @"
            SELECT  CASE WHEN type = 1 THEN -1 * temp.Quantity ELSE temp.Quantity END Quantity,
                    CASE WHEN type = 1 THEN temp.Quantity ELSE 0 END ReturnQuantity,
                    CASE WHEN type = 0 THEN temp.Quantity ELSE 0 END SalesQuantity,
                    dbo.d_shopinfo.shopName ,
                    dbo.x_platForm.pName AS PlatFormName ,
                    temp.ShopId ,
                    dbo.d_shopinfo.blongsPlatform AS PlatFormId ,
                    dbo.d_shopinfo.Comp_id ,
                    OrderTime ,
                                    --dbo.p_products.proName AS Title ,
                                    --ISNULL(a.Quantity, 0) AS ReturnQuantity ,
                                    --temp.Price * ISNULL(a.Quantity, 0) AS ReturnTotalPrice ,
                                                --temp.GrossProfitMargin ,
                                                --temp.GrossProfit ,
                    temp.WDOrderID ,
                    (CASE WHEN (type =1 and AfterTaxTotalPrice - AfterTaxCostPrice>0) THEN 0 ELSE AfterTaxTotalPrice - AfterTaxCostPrice END) AS GrossProfit ,
                    OrderId ,
                    SKU ,
                    ReturnMoney ,
                    OrderRemovalFee ,
                    --ReturnCostPrice ,
                    MarketplaceId ,
                    MSiteId ,
                    FulfillmentChannel ,
                    AfterTaxTotalPrice ,
                    AfterTaxCostPrice ,
                    CASE WHEN type = 1 THEN 0
                         ELSE temp.TotalPrice
                    END TotalPrice ,
                        temp.TotalPrice AS YTotalPrice ,
                    TotalAdditionalCostPrice ,
                    AdditionalCostPrice ,
                    temp.ProgramShippingCosts ,
                    temp.VolumeCost ,
                    CASE WHEN temp.TotalPrice - temp.ReturnMoney = 0 THEN 0
                         ELSE CASE WHEN type = 1 THEN 0
                                   ELSE ( AfterTaxTotalPrice - AfterTaxCostPrice )
                                        / ( temp.TotalPrice - temp.ReturnMoney )
                              END
                    END AS GrossProfitMargin ,
                    temp.CostPrice ,
                    temp.BID ,
                    NAVYPrice ,
                    type ,
                    Cname,
                    CCID,
                    AfterReturnShippingCosts,{2}
                    Bill_Date,
                    PurchaseCost
                    ,TaxRate
                    ,temp.Commission
                    ,temp.CostDiscount
			        ,temp.ExchangeRate
			        ,temp.NewGoodsDiscount
                    ,temp.QualityDiscount
                    ,temp.SupportDiscount
                    ,temp.SpecialDiscount
                    ,temp.FixedFee
                    ,temp.IsNAVY
                    ,temp.OrderType
                    ,ReturnManagementFee
		            {0}
            FROM    ( SELECT
                                ec_CustomCategories1.CCID,
                                ec_CustomCategories1.Cname,
                                temp.TotalPrice ,
                                SUM(temp.Quantity) AS Quantity ,
                                temp.SellerSKU AS SKU ,
                                temp.shopID ,
                                temp.PurchaseDate AS OrderTime ,
                                temp.CostPrice * SUM(temp.Quantity) AS CostPrice ,
                                temp.WDOrderID ,
                                temp.AmazonOrderId AS OrderId ,
                                --SUM(ISNULL(wd_cs_ReturnOrder.Sub_Amt, 0)) Sub_Amt ,
                                --SUM(SingleCostPrice * wd_cs_ReturnOrder.Sub_Qty) AS ReturnCostPrice ,
                                --( ( temp.TotalPrice - SUM(ISNULL(wd_cs_ReturnOrder.Sub_Amt,
                                --                                 0)) ) * ExchangeRate
                                --  * ( 1 - TaxRate / ( TaxRate + 1 ) - Commission ) ) AfterTaxTotalPrice ,
                                --( ( SUM(temp.AdditionalCostPrice)
                                --    + SUM(ProgramShippingCosts) + SUM(VolumeCost) )
                                --  - SUM(SingleCostPrice * ISNULL(wd_cs_ReturnOrder.Sub_Qty,
                                --                                 0)) ) AfterTaxCostPrice ,
                                              --有水军的先扣除水军金额在算毛利
                                SUM(temp.AfterTaxTotalPrice)
                                - CAST(SUM(CASE NavyReasonType WHEN 6 THEN 0 ELSE NAVYPrice END) AS DECIMAL(18, 6)) AS AfterTaxTotalPrice ,
                                (SUM(temp.AdditionalCostPrice)
                                  + SUM(ProgramShippingCosts)
                                  + SUM(VolumeCost)
                                  + SUM(ReturnManagementFee)
						          + SUM(OrderRemovalFee)
                                )AS AfterTaxCostPrice ,
                                --如果是退单的要多算上运费，因为运费没有退回
                                CASE WHEN temp.type = 1 THEN SUM(ProgramShippingCosts)
                                     ELSE 0
                                END AfterReturnShippingCosts ,
                                    MAX(temp.MarketplaceId)AS MarketplaceId ,
                                    MAX(temp.MSiteId)AS MSiteId ,
                                    MAX(FulfillmentChannel) AS FulfillmentChannel  ,
                                    SUM(temp.AdditionalCostPrice)
                                    + SUM(ProgramShippingCosts) + SUM(VolumeCost) AS TotalAdditionalCostPrice ,
                                SUM(ProgramShippingCosts) AS ProgramShippingCosts ,
                                SUM(VolumeCost) AS VolumeCost ,
                                SUM(temp.AdditionalCostPrice) AdditionalCostPrice ,
                                temp.BID ,
                                SUM(NAVYPrice) AS NAVYPrice ,
                                temp.type ,
                                SUM(ReturnMoney) AS ReturnMoney
                                ,SUM(OrderRemovalFee) AS OrderRemovalFee
                                ,{2}
                                MAX(Bill_Date) Bill_Date,
                                SUM(PurchaseCost) AS PurchaseCost
                                ,TaxRate
                                ,Commission
                                ,MAX(temp.CostDiscount)AS CostDiscount
							,MAX(temp.ExchangeRate)AS ExchangeRate
							,MAX(temp.NewGoodsDiscount)AS NewGoodsDiscount
                            ,MAX(temp.QualityDiscount)AS QualityDiscount
                            ,MAX(temp.SupportDiscount)AS SupportDiscount
                            ,MAX(temp.SpecialDiscount)AS SpecialDiscount
                            ,SUM(temp.FixedFee)AS FixedFee
                            ,MAX(temp.NavyReasonType)AS NavyReasonType
                            ,MAX(temp.IsNAVY)AS IsNAVY
                            ,MAX(OrderType) AS OrderType
                            ,SUM(ReturnManagementFee)ReturnManagementFee
                      FROM      ( SELECT    temp1.shopID ,
                                            AmazonOrderId ,
                                            (CASE type WHEN 2 THEN 0 ELSE TotalPrice END) TotalPrice,
                                            ( (CASE type WHEN 2 THEN 0 ELSE temp1.TotalPrice END) * ( 1
                                                                          - TaxRate
                                                                          / ( TaxRate + 1 )
                                                                          - Commission ) ) AfterTaxTotalPrice ,
                                            (CASE type WHEN 2 THEN 0 ELSE Quantity END) Quantity,
                                            SellerSKU ,
                                            PurchaseDate ,
                                            (CASE type WHEN 2 THEN 0 ELSE  temp1.CostPrice END) CostPrice,
                                                                        --PublishID ,
                                            WDOrderID ,
                                            WDOrderDetID ,
                                            BID ,
                                            --wd_OrderDetaliGrossProfit.GoodsId ,
                                            --( ( ( temp1.AdditionalCostPrice
                                            --      * wd_OrderDetaliGrossProfit.CostPriceProportion )
                                            --    + ( ISNULL(ProgramShippingCosts, 0)
                                            --        / Quantity ) + ( ISNULL(VolumeCost, 0)
                                            --                         / Quantity ) )
                                            --  / wd_OrderDetaliGrossProfit.PackageQuantity ) AS SingleCostPrice ,
                                            FulfillmentChannel ,
                                            MarketplaceId ,
                                            MSiteId ,
                                            (CASE type WHEN 2 THEN 0 ELSE AdditionalCostPrice END) * Quantity AS AdditionalCostPrice ,
                                            TaxRate ,
                                            Commission ,
                                            ISNULL((CASE WHEN type = 1 OR type = 2 THEN 0 ELSE ProgramShippingCosts END), 0) AS ProgramShippingCosts ,
                                            ISNULL((CASE WHEN type = 1 OR type = 2 THEN 0 ELSE VolumeCost END) , 0) AS VolumeCost ,
                                            ISNULL(NAVYPrice, 0)
                                            * ExchangeRate AS NAVYPrice ,
                                            type ,
                                            (CASE type WHEN 2 THEN 0 ELSE ReturnMoney END) AS ReturnMoney,
                                            (CASE type WHEN 2 THEN 0 ELSE ReturnManagementFee END) ReturnManagementFee,
                                            (CASE type WHEN 2 THEN 0 ELSE OrderRemovalFee END) AS OrderRemovalFee,
                                            Bill_Date,
                                            (CASE type WHEN 2 THEN 0 ELSE ISNULL(PurchaseCost,0) END) * Quantity AS PurchaseCost
                                            ,CostDiscount
                                            ,ExchangeRate
                                            ,NewGoodsDiscount
                                            ,QualityDiscount
                                            ,SupportDiscount
                                            ,SpecialDiscount
                                            ,(FixedFee * ExchangeRate * (CASE WHEN TYPE = 0 THEN 1 ELSE -1 END)) AS FixedFee
                                            ,NavyReasonType
                                            ,IsNAVY
                                            ,OrderType
                                      FROM      ( SELECT    Orders.ShopId ,
                                                            AmazonOrderId ,
                                                        TotalPrice
                                                        * ExchangeRate AS TotalPrice ,
                                                        Quantity ,
                                                        SellerSKU ,
                                                        --成本时间节点划分 2020之前按单价类型/1.75，2020之后按单价类型/1.45
                                                        CONVERT(decimal(18,2),
                                                                    (
						                                               " + strCostPrice + @"
                                                                    )
                                                                )AS CostPrice,
                                                        WDOrderID ,
                                                        WDOrderDetID ,
                                                        Orders.BID ,
                                                        FulfillmentChannel ,
                                                        MarketplaceId ,
                                                        MSiteId ,
                                                        CONVERT(decimal(18,2),
                                                                    (
						                                               " + strCostPrice + @"
                                                                    )
                                                                    * Orders.QualityDiscount * Orders.SupportDiscount * " + (excludeDiscount ? "1" : "Orders.CostDiscount * Orders.NewGoodsDiscount *  Orders.SpecialDiscount") + @" + (FixedFee * ExchangeRate * (CASE WHEN TYPE=0 THEN 1 ELSE -1 END))
                                                                )AS AdditionalCostPrice,
                                                        TaxRate ,
                                                        ExchangeRate ,
                                                        " + (excludeDiscount ? "1" : "Orders.CostDiscount") + @" AS CostDiscount,
                                                        " + (excludeDiscount ? "1" : "Orders.NewGoodsDiscount") + @" AS NewGoodsDiscount,
                                                        " + (excludeDiscount ? "1" : "Orders.SpecialDiscount") + @" AS SpecialDiscount,
                                                        QualityDiscount,
                                                        SupportDiscount,
                                                        FixedFee,
                                                      " + feesFileds + @"
                                                        VolumeCost ,
                                                         (CASE WHEN (" + navyInMonthWhere + @") THEN 2 ELSE type END) AS type ,
                                                        ReturnMoney
                                                        * ExchangeRate AS ReturnMoney,
                                                        (
					                                        CASE WHEN type = 1 AND LEN(MarketplaceId) > 10
							                                    THEN (CASE WHEN OrderType = 1 THEN 0 ELSE ReturnMoney * 0.2 * Commission END)
							                                    ELSE 0
							                                    END
					                                     ) AS ReturnManagementFee
                                                        " + strOtherFileds + @"
                                                       , Orders.Bill_Date,
                                                       " + (!string.IsNullOrEmpty(orderPurchaseCostSql) ? "(ec_BaseInfoWithCom_Detail.PackageQuantity * Order_Purchase_Cost.CbPrice * (CASE WHEN TYPE=0 THEN 1 ELSE -1 END))" : "0") + @" as PurchaseCost,
                                                       (CASE WHEN (" + navyNotInMonthWhere + @") THEN 0 ELSE NavyAmount END) as NAVYPrice,
                                                       (
														   CASE WHEN (" + navyNotInMonthWhere + @")
															   THEN 0
															   ELSE
															   (
															      CASE WHEN NavyPaymentDate IS NOT NULL THEN 1 ELSE 0 END
															   )
															   END) as IsNAVY,
                                                       OrderType,
                                                       NavyPaymentDate,
                                                       NavyReasonType
                                                       {3}
                                                  FROM  " + strInitTable + @"
                                                 " + innerJoinAGBSSql + @"
                                                 " + billAccountSql + @"
                                                 " + orderPurchaseCostSql + @"
                                                  WHERE     ( type = 1
                                                          " + _csReturnOrderWhere + @"
                                                        )
                                                        OR type = 0
                                            ) temp1
                                ) AS temp
                                INNER JOIN ec_CustomCategories_Item ON ec_CustomCategories_Item.BID = temp.BID AND ec_CustomCategories_Item.Type = 1
                                INNER JOIN dbo.ec_CustomCategories ON ec_CustomCategories.CCID = ec_CustomCategories_Item.CCID
                                INNER JOIN ec_CustomCategories ec_CustomCategories1 ON ec_CustomCategories1.CCID = ec_CustomCategories.ParentID
                                --JOIN dbo.ec_BaseInfo ON ec_BaseInfo.BID = temp.BID
                                --                        AND VariationMark = 2
                                --LEFT JOIN ( SELECT  Ebp_Bill_Code ,
                                --                    Goods_Id ,
                                --                    SUM(Sub_Amt) Sub_Amt ,
                                --                    SUM(Sub_Qty) Sub_Qty ,
                                --                    MAX(OriginalShopId) OriginalShopId
                                --            FROM    wd_cs_ReturnOrder
                                --            GROUP BY Ebp_Bill_Code ,
                                --                    Goods_Id
                                --          ) wd_cs_ReturnOrder ON Ebp_Bill_Code = temp.AmazonOrderId
                                --                                 AND OriginalShopId = temp.shopID
                                --                                 AND Goods_Id = temp.GoodsId
					              {1}
                      GROUP BY  temp.TotalPrice ,
                                temp.Quantity ,
                                temp.SellerSKU ,
                                temp.shopID ,
                                temp.PurchaseDate ,
                                temp.CostPrice ,
                                temp.WDOrderID ,
                                temp.WDOrderDetID ,
                                temp.AmazonOrderId ,
                                    --temp.MarketplaceId ,
                                    --FulfillmentChannel ,
                                                            --AdditionalCostPrice ,
                                {2}
                                temp.BID ,
                                temp.type,
                                ec_CustomCategories1.CCID,
                                ec_CustomCategories1.Cname
                                ,TaxRate
                                ,Commission
                    ) temp
                    INNER JOIN dbo.d_shopinfo ON dbo.d_shopinfo.shopID = temp.shopID
                    INNER JOIN dbo.x_platForm ON dbo.x_platForm.PID = dbo.d_shopinfo.blongsPlatform
                    ";
            //勾选商品的时候
            if (reportGroup.Contains("SKU"))
            {
                //reportGroup += ",Title";
            }
            else
            {
                #region MyRegion

                //                strSql = @"
                //                SELECT  DISTINCT
                //                        temp.TotalPrice ,
                //                        dbo.d_shopinfo.shopName ,
                //                        dbo.x_platForm.pName AS PlatFormName ,
                //                        temp.shopID ,
                //                        dbo.d_shopinfo.blongsPlatform AS PlatFormId ,
                //                        dbo.d_shopinfo.Comp_id ,
                //                        temp.PurchaseDate AS OrderTime ,
                //                        ISNULL(dbo.r_OrderReturns.ReturnMoney, 0) AS ReturnMoney ,
                //                        temp.FulfillmentChannel ,
                //                        temp.MarketplaceId ,
                //                        temp.AmazonOrderId ,
                //                        --GrossProfitMargin ,
                //                        --temp.GrossProfit ,
                //                        --CostPrice
                //                        TotalCostPrice ,
                //                        TotalGrossProfit ,
                //                        TotalGrossProfitMargin
                //                FROM      ( SELECT    dbo.wd_order_amazon.WDOrderID ,
                //                                    dbo.wd_order_amazon.shopID ,
                //                                    dbo.wd_order_amazon.OrderAmount AS TotalPrice ,
                //                                    dbo.wd_order_amazon.PurchaseDate ,
                //                                                    --ISNULL(dbo.r_OrderReturns.ReturnMoney,
                //                                                    --      0) AS ReturnMoney ,
                //                                    dbo.wd_order_amazon.AmazonOrderId ,
                //                                    FulfillmentChannel ,
                //                                    wd_order_amazon.MarketplaceId ,
                //                                    PublishID ,
                //                                    TotalCostPrice ,
                //                                    TotalGrossProfit ,
                //                                    TotalGrossProfitMargin
                //                                    --,
                //                                    --SUM(GrossProfitMargin) / COUNT(1) AS GrossProfitMargin ,
                //                                    --SUM(GrossProfit
                //                                    --    * ( dbo.wd_orderDet_amazon.QuantityOrdered
                //                                    --        - dbo.r_OrderReturnsDetail.Quantity )) AS GrossProfit ,
                //                                    --SUM(CostPrice
                //                                    --    * ( dbo.wd_orderDet_amazon.QuantityOrdered
                //                                    --        - dbo.r_OrderReturnsDetail.Quantity )) AS CostPrice
                //                            FROM      dbo.wd_order_amazon WITH ( NOLOCK )
                //                                    INNER JOIN dbo.wd_orderDet_amazon WITH ( NOLOCK ) ON dbo.wd_orderDet_amazon.WDOrderID = dbo.wd_order_amazon.WDOrderID
                //                                    JOIN p_Publish_Offer_Amazon ON p_Publish_Offer_Amazon.ShopID = wd_order_amazon.shopID
                //                                                                    AND p_Publish_Offer_Amazon.MarketplaceID = wd_order_amazon.MarketplaceId
                //                                                                    AND ISNULL(historySellerSKU,
                //                                                                    p_Publish_Offer_Amazon.SellerSKU) = wd_orderDet_amazon.SellerSKU
                //                                    --LEFT OUTER JOIN dbo.r_OrderReturns WITH ( NOLOCK ) ON dbo.r_OrderReturns.WdOrderId = dbo.wd_order_amazon.WDOrderID
                //                                    --                              AND dbo.r_OrderReturns.ShopId = dbo.wd_order_amazon.shopID
                //                                    --                              AND dbo.r_OrderReturns.type = 1
                //                                    --LEFT OUTER JOIN dbo.r_OrderReturnsDetail ON dbo.r_OrderReturnsDetail.OrderReturnsId = dbo.r_OrderReturns.OrderReturnsId
                //                                    --                              AND dbo.wd_orderDet_amazon.WDOrderDetID = dbo.r_OrderReturnsDetail.OrderDetailId
                //                            --WHERE     QuantityOrdered <> 0
                //                            --GROUP BY  dbo.wd_order_amazon.WDOrderID ,
                //                            --          dbo.wd_order_amazon.shopID ,
                //                            --          dbo.wd_order_amazon.BuyerName ,
                //                            --          dbo.wd_order_amazon.OrderAmount ,
                //                            --          dbo.wd_order_amazon.PurchaseDate ,
                //                            --          dbo.wd_order_amazon.AmazonOrderId ,
                //                            --          FulfillmentChannel ,
                //                            --          wd_order_amazon.MarketplaceId ,
                //                            --          PublishID
                //                            UNION ALL
                //                            SELECT    dbo.wd_order_ebay.WDOrderID ,
                //                                    dbo.wd_order_ebay.shopID ,
                //                                    dbo.wd_order_ebay.Total AS TotalPrice ,
                //                                    dbo.wd_order_ebay.CreatedTime AS PurchaseDate ,
                //                                    dbo.wd_order_ebay.OrderID AS AmazonOrderId ,
                //                                    '' FulfillmentChannel ,
                //                                    '' MarketplaceId ,
                //                                    PublishId ,
                //                                    TotalCostPrice ,
                //                                    TotalGrossProfit ,
                //                                    TotalGrossProfitMargin
                //                                    --,
                //                                    --SUM(GrossProfitMargin) / COUNT(1) AS GrossProfitMargin ,
                //                                    --SUM(GrossProfit * ( QuantityPurchased
                //                                    --                    - r_OrderReturnsDetail_1.Quantity )) AS GrossProfit ,
                //                                    --SUM(CostPrice * ( QuantityPurchased
                //                                    --                  - r_OrderReturnsDetail_1.Quantity )) AS CostPrice
                //                            FROM      dbo.wd_order_ebay WITH ( NOLOCK )
                //                                    INNER JOIN dbo.wd_orderDet_ebay WITH ( NOLOCK ) ON dbo.wd_orderDet_ebay.WDOrderID = dbo.wd_order_ebay.WDOrderID
                //                                    JOIN dbo.p_Publish ON p_Publish.ShopId = wd_order_ebay.shopID
                //                                                            AND p_Publish.ItemId = wd_orderDet_ebay.ItemID
                //                                    --LEFT OUTER JOIN dbo.r_OrderReturns AS r_OrderReturns_1
                //                                    --WITH ( NOLOCK ) ON r_OrderReturns_1.WdOrderId = dbo.wd_order_ebay.WDOrderID
                //                                    --                   AND r_OrderReturns_1.ShopId = dbo.wd_order_ebay.shopID
                //                                    --                   AND r_OrderReturns_1.type = 1
                //                                    --LEFT OUTER JOIN dbo.r_OrderReturnsDetail AS r_OrderReturnsDetail_1 ON r_OrderReturnsDetail_1.OrderReturnsId = r_OrderReturns_1.OrderReturnsId
                //                                    --                              AND dbo.wd_orderDet_ebay.WDOrderDetID = r_OrderReturnsDetail_1.OrderDetailId
                //                            --GROUP BY  dbo.wd_order_ebay.WDOrderID ,
                //                            --          dbo.wd_order_ebay.shopID ,
                //                            --          dbo.wd_order_ebay.Name ,
                //                            --          dbo.wd_order_ebay.Total ,
                //                            --          dbo.wd_order_ebay.CreatedTime ,
                //                            --          dbo.wd_order_ebay.OrderID ,
                //                            --          PublishId
                //                            UNION ALL
                //                            SELECT    dbo.wd_Order_PrestaShop.OrderPrestaShopId ,
                //                                    dbo.wd_Order_PrestaShop.ShopId ,
                //                                    dbo.wd_Order_PrestaShop.OrderTotal AS TotalPrice ,
                //                                    dbo.wd_Order_PrestaShop.OrderDate AS PurchaseDate ,
                //                                    dbo.wd_Order_PrestaShop.OrderId AS AmazonOrderId ,
                //                                    '' FulfillmentChannel ,
                //                                    '' MarketplaceId ,
                //                                    PublishID ,
                //                                    TotalCostPrice ,
                //                                    TotalGrossProfit ,
                //                                    TotalGrossProfitMargin
                //                                    --,
                //                                    --SUM(GrossProfitMargin) / COUNT(1) AS GrossProfitMargin ,
                //                                    --SUM(GrossProfit * ( QuantityPurchased
                //                                    --                    - r_OrderReturnsDetail_1.Quantity )) AS GrossProfit ,
                //                                    --SUM(CostPrice * ( QuantityPurchased
                //                                    --                  - r_OrderReturnsDetail_1.Quantity )) AS CostPrice
                //                            FROM      dbo.wd_Order_PrestaShop WITH ( NOLOCK )
                //                                    INNER JOIN dbo.wd_Order_PrestaShop_Item WITH ( NOLOCK ) ON dbo.wd_Order_PrestaShop_Item.OrderPrestaShopId = dbo.wd_Order_PrestaShop.OrderPrestaShopId
                //                                    JOIN dbo.p_Publish_Offer_Bol ON p_Publish_Offer_Bol.ShopID = wd_Order_PrestaShop.ShopId
                //                                                                    AND p_Publish_Offer_Bol.SellerSKU = wd_Order_PrestaShop_Item.SKU
                //                        ) AS temp
                //                        LEFT OUTER JOIN dbo.r_OrderReturns WITH ( NOLOCK ) ON dbo.r_OrderReturns.WdOrderId = temp.WDOrderID
                //                                                                    AND dbo.r_OrderReturns.ShopId = temp.shopID
                //                                                                    AND dbo.r_OrderReturns.type = 1
                //                        INNER JOIN dbo.d_shopinfo ON dbo.d_shopinfo.shopID = temp.shopID
                //                        INNER JOIN dbo.x_platForm ON dbo.x_platForm.PID = dbo.d_shopinfo.blongsPlatform";
                #endregion
                //                strSql = string.Format(strSql, ", wd_cs_ReturnOrder.Sub_Amt AS ReturnDiscount", @" LEFT JOIN ( SELECT  Ebp_Bill_Code ,
                //                                        Goods_Id ,
                //                                        SUM(Sub_Amt) Sub_Amt ,
                //                                        MAX(OriginalShopId) OriginalShopId
                //                                FROM    wd_cs_ReturnOrder
                //                                WHERE   Goods_Id = -4
                //                                GROUP BY Ebp_Bill_Code ,
                //                                        Goods_Id
                //                              ) wd_cs_ReturnOrder ON Ebp_Bill_Code = temp.OrderId
                //                                                     AND OriginalShopId = temp.shopID
                //          --WHERE     temp.OrderId IN ( SELECT    Ebp_Bill_Code
                //          --                            FROM      wd_cs_ReturnOrder
                //          --                            WHERE     Goods_Id = -4 )
                //        ");
                //                strSql = string.Format(strSql, "", "");
                //                if (request.Params["GroupIds"].Length > 0)
                //                {
                //                    strSql += @"
                //                    JOIN (
                //                        SELECT  ec_CustomCategories_Item.BID
                //                        FROM    dbo.ec_CustomCategories
                //                                JOIN ec_CustomCategories ec_CustomCategories1 ON ec_CustomCategories1.TreeKey LIKE ( '%'
                //                                                                                      + ec_CustomCategories.TreeKey
                //                                                                                      + '%' )
                //                                JOIN dbo.ec_CustomCategories_Item ON ec_CustomCategories_Item.CCID = ec_CustomCategories1.CCID
                //                        WHERE   ec_CustomCategories.CCID = '" + request.Params["GroupIds"] + @"'
                //                                AND ec_CustomCategories_Item.Type <> 2) cc ON cc.BID = temp.BID";
                //                }
                //reportGroup += ",SKU";
            }

            string sql = string.Empty;
            string otherFileds = string.Empty;
            if (request.Params["GroupIds"].Length > 0 && request.Params["GroupIds"].ToString() != "1")
            {
                sql = @"
                WHERE     EXISTS ( SELECT 1
                                         FROM   ( SELECT DISTINCT
                                                    BID ,
                                                    d_ProductResponsibleProgramDetail.ShopId ,
                                                    CASE WHEN PlatFormType = 'BOL' THEN ''
                                                         ELSE MarketplaceId
                                                    END AS MarketplaceId ,
                                                    CreateDate ,
                                                    EndDate
                                            FROM    dbo.d_ProductResponsibleProgram
                                                    JOIN dbo.d_ProductResponsibleProgramDetail ON d_ProductResponsibleProgram.ProductResponsibleProgramId = d_ProductResponsibleProgramDetail.ProductResponsibleProgramId
                                                    JOIN dbo.d_ShopAmazonToMarketplace ON d_ShopAmazonToMarketplace.ShopId = d_ProductResponsibleProgramDetail.ShopId
                                                              AND d_ShopAmazonToMarketplace.MSiteId = d_ProductResponsibleProgram.MSiteId
                                                    JOIN dbo.d_ProductResponsible_Item ON d_ProductResponsibleProgramDetail.ProductResponsibleProgramId = d_ProductResponsible_Item.ProductResponsibleProgramId
                                                    WHERE d_ProductResponsible_Item.PRCId In
                                                    (
                                                        SELECT p1.PRCId FROM d_ProductResponsibleCategory p1 WHERE p1.PRCId = '" + request.Params["GroupIds"] + @"'
                                                        UNION ALL
                                                        SELECT p2.PRCId FROM d_ProductResponsibleCategory p1
                                                        INNER JOIN d_ProductResponsibleCategory p2 ON p2.pPRCId = p1.PRCId
                                                        WHERE p1.PRCId = '" + request.Params["GroupIds"] + @"'
                                                    )
                                                ) cc
                                         WHERE  1=1
                                                AND cc.BID = temp.BID
                                                AND cc.ShopId = temp.shopID
                                                AND cc.MarketplaceId = temp.MarketplaceId
                                                AND ( ( cc.CreateDate IS NULL
                                                        OR temp.PurchaseDate > cc.CreateDate
                                                      )
                                                      AND ( cc.EndDate IS NULL
                                                            OR temp.PurchaseDate < cc.EndDate
                                                          )
                                                    ) )";
            }
            if ((string.IsNullOrEmpty(request.Params["GroupIds"].ToString()) || request.Params["GroupIds"].ToString() == "1") && request.Params["needPRC"] == "1")
            {
                sql = @"       LEFT JOIN ( SELECT DISTINCT
                                                BID ,
                                                d_ProductResponsible_Item.PRCId ,
                                                    --d_ProductResponsibleCategory.Name,
                                                d_ProductResponsibleProgramDetail.ShopId ,
                                                CASE WHEN PlatFormType = 'BOL'
                                                     THEN ''
                                                     ELSE MarketplaceId
                                                END AS MarketplaceId ,
                                                CreateDate ,
                                                EndDate
                                       FROM     dbo.d_ProductResponsibleProgram
                                                JOIN dbo.d_ProductResponsibleProgramDetail ON d_ProductResponsibleProgram.ProductResponsibleProgramId = d_ProductResponsibleProgramDetail.ProductResponsibleProgramId
                                                JOIN dbo.d_ShopAmazonToMarketplace ON d_ShopAmazonToMarketplace.ShopId = d_ProductResponsibleProgramDetail.ShopId
                                                              AND d_ShopAmazonToMarketplace.MSiteId = d_ProductResponsibleProgram.MSiteId
                                                JOIN dbo.d_ProductResponsible_Item ON d_ProductResponsibleProgramDetail.ProductResponsibleProgramId = d_ProductResponsible_Item.ProductResponsibleProgramId
                                                    --JOIN dbo.d_ProductResponsibleCategory ON d_ProductResponsibleCategory.PRCId = d_ProductResponsible_Item.PRCId
                                                  --WHERE     d_ProductResponsible_Item.PRCId = '" + request.Params["GroupIds"] + @"'
                                     ) cc ON 1 = 1
                                             AND cc.BID = temp.BID
                                             AND cc.ShopId = temp.shopID
                                             AND cc.MarketplaceId = temp.MarketplaceId
                                             AND ( ( cc.CreateDate IS NULL
                                                     OR temp.PurchaseDate > cc.CreateDate
                                                   )
                                                   AND ( cc.EndDate IS NULL
                                                         OR temp.PurchaseDate < cc.EndDate
                                                       )
                                                 )";
                otherFileds = "PRCId,";

            }
            strSql = string.Format(strSql, "", sql, otherFileds, strSpecialFields);

            if (request.Params.AllKeys.Contains("NegativeGrossProfit") && request.Params["NegativeGrossProfit"] == "true")
            {
                tempWhereSql += @" AND NOT EXISTS ( SELECT 1
                                FROM dbo.ec_BaseInfo
                                WHERE  BarcodeMark = 'L'
                                            AND ec_BaseInfo.BID = a.BID
                                            AND a.GrossProfit < 0 )";
            }
            if (request.Params.AllKeys.Contains("NegativeNAVY") && (request.Params["NegativeNAVY"] == "true" || request.Params["NegativeNAVY"] == "on"))
            {
                tempWhereSql += " AND IsNAVY = 0 ";
            }
            if (request.Params.AllKeys.Contains("ContainNAVY") && (request.Params["ContainNAVY"] == "true" || request.Params["ContainNAVY"] == "on"))
            {
                tempWhereSql += " AND IsNAVY = 1 ";
            }

            if (!string.IsNullOrEmpty(request.Params["BID"]))
            {
                tempWhereSql += " and BID = '" + request.Params["BID"].Trim() + "'";
            }
            // 销售类型
            if (!string.IsNullOrEmpty(request.Params["selSalesType"]) && request.Params["selSalesType"] != "-1")
            {
                tempWhereSql += " and type = " + request.Params["selSalesType"].Trim() + "";
            }
            if (request.Params["ifDetailDataLoad"] == "0")
            {
                string leftJoinTable = "";
                if (request.Params["needPRC"] == "1")
                {
                    reportGroup += ",a.PRCId,d_ProductResponsibleCategory.Name";
                    leftJoinTable = " left JOIN dbo.d_ProductResponsibleCategory ON d_ProductResponsibleCategory.PRCId = a.PRCId";
                }
                if (reportGroup.Contains("SKU") && !reportGroup.Contains("Cname"))
                    reportGroup += ",Cname";
                strSql = string.Format(@"SELECT {0},SUM(Quantity) AS Quantity,SUM(ReturnQuantity) AS ReturnQuantity,SUM(SalesQuantity) AS SalesQuantity,CAST(IIF(SUM(SalesQuantity)=0,0,SUM(ReturnQuantity)*100/SUM(SalesQuantity)) as decimal(18, 2)) AS ReturnRates,ROUND(SUM(TotalPrice),2) TotalPrice,ROUND(SUM(ReturnMoney),2) AS ReturnMoney,ROUND(SUM(OrderRemovalFee),2) AS OrderRemovalFee,ROUND(SUM(TotalPrice-ReturnMoney),2) AS SalesAmount,ROUND(SUM(AdditionalCostPrice),2) AS AdditionalCostPrice ,ROUND(SUM(TotalAdditionalCostPrice),2) AS TotalAdditionalCostPrice ,ROUND(SUM(GrossProfit),2) AS GrossProfit,CASE WHEN SUM(TotalPrice-ReturnMoney)=0 THEN 0 else ROUND(CASE WHEN (SUM(GrossProfit)<0 AND SUM(TotalPrice-ReturnMoney)<0) THEN (-(SUM(GrossProfit)/SUM(TotalPrice-ReturnMoney))) ELSE SUM(GrossProfit)/SUM(TotalPrice-ReturnMoney) END, 4) * 100 end GrossProfitMargin,COALESCE(SUM(NAVYPrice),0) NAVYPrice,CASE WHEN SUM(TotalPrice)=0 THEN 0 else CAST(ISNULL(SUM(ReturnMoney),0)*100/SUM(TotalPrice) AS decimal(18,2)) end SalesReturnRate,ROUND(SUM(PurchaseCost),2) AS PurchaseCost FROM (" + strSql + ") a {2} WHERE {1} GROUP BY {0} ", reportGroup, _sbWhere + tempWhereSql, leftJoinTable);
            }
            else
            {
                if (!reportGroup.Contains("SKU"))
                    reportGroup += ",SKU,Cname";
                strSql = string.Format(@"SELECT {0},OrderId,ROUND(TotalPrice,2) AS TotalPrice,ROUND(ReturnMoney,2) AS ReturnMoney,ROUND(OrderRemovalFee,2) AS OrderRemovalFee,ROUND(TotalPrice-ReturnMoney,2) AS SalesAmount,ROUND(AdditionalCostPrice,2) AS AdditionalCostPrice, ROUND(TotalAdditionalCostPrice,2) AS TotalAdditionalCostPrice,ROUND(ISNULL(GrossProfit,0),2) AS GrossProfit,ROUND(ISNULL(GrossProfitMargin,0),4)*100 AS GrossProfitMargin,ISNULL(NAVYPrice,0) NAVYPrice,CASE WHEN TotalPrice=0 THEN 0 else ROUND(ReturnMoney/TotalPrice,4)*100 end SalesReturnRate,ProgramShippingCosts,VolumeCost,Quantity,ROUND(PurchaseCost,2) AS PurchaseCost,FulfillmentChannel,TaxRate ,Commission,BID,MarketplaceId,a.ShopName,CostPrice,CostDiscount,ExchangeRate,NewGoodsDiscount,QualityDiscount,SupportDiscount,SpecialDiscount,FixedFee,IsNAVY,Type,OrderType,ReturnManagementFee FROM (" + strSql + ") a WHERE {1}", reportGroup, _sbWhere + tempWhereSql);
            }
            return strSql;
```

:::
