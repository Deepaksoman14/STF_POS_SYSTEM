import { query } from "../../db/index.js";

export async function getSummary(businessId) {
  const [todaySalesRes, lowStock, outstanding, recentBills, totalsRes, qtyRes, dailyAvgRes, profitRes] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(net_total), 0)::numeric(12,2) AS today_sales,
              COUNT(*)::int AS bills_count
       FROM sale
       WHERE business_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [businessId]
    ),
    query(
      `SELECT COUNT(*)::int AS low_stock
       FROM product
       WHERE business_id = $1 AND stock_qty <= reorder_level AND is_active = true`,
      [businessId]
    ),
    query(
      `SELECT COALESCE(SUM(credit_due), 0)::numeric(12,2) AS credit_due
       FROM customer
       WHERE business_id = $1`,
      [businessId]
    ),
    query(
      `SELECT s.id,
              s.bill_no,
              s.payment_mode,
              s.gross_total,
              s.discount,
              s.net_total,
              s.created_by,
              s.created_at,
              c.name AS customer_name
       FROM sale s
       LEFT JOIN customer c ON c.id = s.customer_id
       WHERE s.business_id = $1
       ORDER BY s.created_at DESC
       LIMIT 20`,
      [businessId]
    ),
    query(
      `SELECT COALESCE(SUM(net_total), 0)::numeric(12,2) AS total_sales,
              COUNT(*)::int AS total_invoices
       FROM sale
       WHERE business_id = $1`,
      [businessId]
    ),
    query(
      `SELECT COALESCE(SUM(si.qty), 0)::int AS total_qty
       FROM sale_item si
       JOIN sale s ON s.id = si.sale_id
       WHERE s.business_id = $1`,
      [businessId]
    ),
    query(
      `SELECT COALESCE(AVG(daily_total), 0)::numeric(12,2) AS daily_avg
       FROM (
         SELECT DATE(created_at) AS day, SUM(net_total) AS daily_total
         FROM sale
         WHERE business_id = $1
         GROUP BY DATE(created_at)
       ) t`,
      [businessId]
    ),
    query(
      `SELECT COALESCE(SUM(si.selling_price_total - si.cost_price_total), 0)::numeric(12,2) AS total_profit
       FROM sale_item si
       JOIN sale s ON s.id = si.sale_id
       WHERE s.business_id = $1`,
      [businessId]
    )
  ]);

  const todaySales = Number(todaySalesRes.rows[0].today_sales || 0);
  const billsCount = Number(todaySalesRes.rows[0].bills_count || 0);
  const totalSales = Number(totalsRes.rows[0].total_sales || 0);
  const totalProfit = Number(profitRes.rows[0].total_profit || 0);
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  return {
    todaySales: todaySalesRes.rows[0].today_sales,
    billsCount: todaySalesRes.rows[0].bills_count,
    lowStockItems: lowStock.rows[0].low_stock,
    creditOutstanding: outstanding.rows[0].credit_due,
    avgBillValue: billsCount > 0 ? (todaySales / billsCount).toFixed(2) : "0.00",
    recentBills: recentBills.rows,
    totalSales: totalsRes.rows[0].total_sales,
    totalInvoices: totalsRes.rows[0].total_invoices,
    totalQtySold: qtyRes.rows[0].total_qty,
    dailyAverageSales: dailyAvgRes.rows[0].daily_avg,
    totalProfit: profitRes.rows[0].total_profit,
    profitMargin
  };
}
