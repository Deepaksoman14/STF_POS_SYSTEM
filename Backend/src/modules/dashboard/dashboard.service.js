import { query } from "../../db/index.js";

export async function getSummary(businessId) {
  const [sales, lowStock, outstanding, recentBills] = await Promise.all([
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
       WHERE business_id = $1 AND stock_qty <= reorder_level`,
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
    )
  ]);

  const todaySales = Number(sales.rows[0].today_sales || 0);
  const billsCount = Number(sales.rows[0].bills_count || 0);

  return {
    todaySales: sales.rows[0].today_sales,
    billsCount: sales.rows[0].bills_count,
    lowStockItems: lowStock.rows[0].low_stock,
    creditOutstanding: outstanding.rows[0].credit_due,
    avgBillValue: billsCount > 0 ? (todaySales / billsCount).toFixed(2) : "0.00",
    recentBills: recentBills.rows
  };
}
