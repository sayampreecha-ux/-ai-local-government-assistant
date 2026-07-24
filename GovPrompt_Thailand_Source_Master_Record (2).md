# GovPrompt Thailand - Source Inventory (Master Record)

วันที่จัดทำ: 24 กรกฎาคม 2569

## Source of Truth

-   Prompt Master:
    -   govprompt-thailand-owner-master-v5.0-222.zip

## Deployment Base

-   govprompt-thailand-v5.0-222-deploy.zip

## Supporting Packages

-   GovPrompt_ChatGPT_Site_Import_v5.0.zip
-   govprompt-thailand-enterprise-v4.2-source.zip
-   govprompt-thailand-vercel-drop-v4.2.zip
-   GovPrompt51.zip (ใช้เป็นแหล่งอ้างอิงเฉพาะฟังก์ชันใหม่)
-   GovPrompt_ชุดขาย_รหัสตัวเลข_222บาท.zip

## Development Rules

1.  ใช้แนวทาง Merge & Upgrade
2.  ห้ามสร้างระบบใหม่ทับของเดิม
3.  ห้ามล้างฐานข้อมูล
4.  รักษา GP001--GP222 ให้ครบ
5.  รักษาสมาชิก ร่างงาน ประวัติ รายการโปรด และข้อมูลเดิม
6.  Merge เฉพาะฟังก์ชันที่ดีจากเวอร์ชันใหม่
7.  Publish หลังผ่าน Regression Test และ Preview เท่านั้น

## Recommended Backup

เก็บไฟล์ต้นฉบับอย่างน้อย 3 ชุด - เครื่องหลัก - External SSD/HDD - Cloud (เช่น
iCloud Drive หรือ Google Drive)
