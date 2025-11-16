import puppeteer from 'puppeteer';
import fs from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import db from '../db/db.js'; // your database connection

export async function generateOrderPDF(order, settings = {}) {
  const templatePath = path.resolve('template', 'orderTemplate.hbs');
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateHtml);

  // --- Get logo URL from settings table ---
  const logoRecord = await db('settings').select('logo_url').first();

  const absolutePath = logoRecord?.logo_url
    ? path.resolve('public', 'uploads', 'logo', path.basename(logoRecord.logo_url))
    : null;

  const logoBase64 = fs.existsSync(absolutePath)
  ? `data:image/png;base64,${fs.readFileSync(absolutePath).toString('base64')}`
  : null;
  // --- Pass data to template ---
  const html = template({
    name: order.name,
    orderId: order.id,
    email: order.email,
    address: order.address,
    items: order.items,
    orderSummary: order.items.map(
      (item, idx) => `<p>${idx + 1}. ${item.name} - ${item.quantity} x ₹${item.price}</p>`
    ).join(''),
    contact_email: settings.contact_email || 'support@example.com',
    contact_phone: settings.contact_phone || '1234567890',
    site_name: settings.site_name || 'Company Name',
    total: order.total_amount || order.total || 0,
    logo: logoBase64 || ' ', // Puppeteer can load local file URLs
  });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '30px', bottom: '30px' } });
  await browser.close();

  return pdfBuffer;
}
