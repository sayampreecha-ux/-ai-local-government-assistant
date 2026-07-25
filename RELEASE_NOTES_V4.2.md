[
  {
    "tool_id": "gp001",
    "gp_code": "GP001",
    "name": "AI ผู้ช่วยร่างหนังสือราชการ",
    "description": "หนังสือภายนอก บันทึกข้อความ หรือหนังสือภายใน",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP001 — AI ผู้ช่วยร่างหนังสือราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp002",
    "gp_code": "GP002",
    "name": "ร่างบันทึกข้อความเสนอผู้บริหารฉบับครบถ้วน",
    "description": "จัดข้อเท็จจริง ข้อพิจารณา และข้อเสนอ",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP002 — ร่างบันทึกข้อความเสนอผู้บริหารฉบับครบถ้วน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานเจ้าของเรื่อง"
      },
      {
        "id": "subject",
        "label": "ประเภทและชื่อเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทและชื่อเรื่อง"
      },
      {
        "id": "field_03",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้รับหรือผู้เกี่ยวข้อง"
      },
      {
        "id": "objective",
        "label": "ข้อเท็จจริงและวัตถุประสงค์",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงและวัตถุประสงค์"
      },
      {
        "id": "documents",
        "label": "เอกสารอ้างอิงหรือสิ่งที่ส่งมาด้วย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเอกสารอ้างอิงหรือสิ่งที่ส่งมาด้วย"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp003",
    "gp_code": "GP003",
    "name": "ร่างหนังสือภายนอก",
    "description": "จัดรูปแบบหนังสือพร้อมอ้างถึงและสิ่งที่ส่งมาด้วย",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP003 — ร่างหนังสือภายนอก\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานเจ้าของเรื่อง"
      },
      {
        "id": "subject",
        "label": "ประเภทและชื่อเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทและชื่อเรื่อง"
      },
      {
        "id": "field_03",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้รับหรือผู้เกี่ยวข้อง"
      },
      {
        "id": "objective",
        "label": "ข้อเท็จจริงและวัตถุประสงค์",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงและวัตถุประสงค์"
      },
      {
        "id": "documents",
        "label": "เอกสารอ้างอิงหรือสิ่งที่ส่งมาด้วย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเอกสารอ้างอิงหรือสิ่งที่ส่งมาด้วย"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp004",
    "gp_code": "GP004",
    "name": "ร่างบันทึกข้อความแบบย่อเพื่อเสนออนุมัติหรือเห็นชอบ",
    "description": "เสนอเรื่องเพื่ออนุมัติหรือเห็นชอบ",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP004 — ร่างบันทึกข้อความแบบย่อเพื่อเสนออนุมัติหรือเห็นชอบ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp005",
    "gp_code": "GP005",
    "name": "จัดทำบันทึกข้อความเสนอผู้บริหารแบบมีข้อพิจารณา",
    "description": "สรุปเรื่องเดิม ข้อเท็จจริง กฎหมาย การวิเคราะห์ และข้อเสนอ",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP005 — จัดทำบันทึกข้อความเสนอผู้บริหารแบบมีข้อพิจารณา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp006",
    "gp_code": "GP006",
    "name": "แม่แบบร่างหนังสือราชการพร้อมจุดตรวจสอบ",
    "description": "ร่างหนังสือภายนอก บันทึกข้อความ หรือหนังสือภายใน พร้อมจุดตรวจสอบก่อนลงนาม",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP006 — แม่แบบร่างหนังสือราชการพร้อมจุดตรวจสอบ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานเจ้าของเรื่อง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่อง"
      },
      {
        "id": "field_03",
        "label": "ผู้รับหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้รับหนังสือ"
      },
      {
        "id": "field_04",
        "label": "หลักการและเหตุผล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหลักการและเหตุผล"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุวัตถุประสงค์"
      },
      {
        "id": "legal_sources",
        "label": "ข้อกฎหมาย ระเบียบ หรือหนังสืออ้างอิง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุข้อกฎหมาย ระเบียบ หรือหนังสืออ้างอิง"
      },
      {
        "id": "field_07",
        "label": "ประเด็นที่ต้องการให้ดำเนินการ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องการให้ดำเนินการ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp007",
    "gp_code": "GP007",
    "name": "ร่างหนังสือราชการทั่วไปแบบตรวจคุณภาพ",
    "description": "ตรวจข้อมูล วิเคราะห์ ร่าง และตรวจคุณภาพหนังสือภายในหรือภายนอก",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP007 — ร่างหนังสือราชการทั่วไปแบบตรวจคุณภาพ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp008",
    "gp_code": "GP008",
    "name": "ร่างคำสั่งราชการแบบพื้นฐาน",
    "description": "ใช้แต่งตั้ง มอบหมาย หรือตั้งคณะทำงาน",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP008 — ร่างคำสั่งราชการแบบพื้นฐาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp009",
    "gp_code": "GP009",
    "name": "ร่างคำสั่งราชการพร้อมตรวจอำนาจและผู้ลงนาม",
    "description": "แต่งตั้งคณะกรรมการ คณะทำงาน มอบหมายหน้าที่ หรือมอบอำนาจ",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP009 — ร่างคำสั่งราชการพร้อมตรวจอำนาจและผู้ลงนาม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่อง"
      },
      {
        "id": "field_03",
        "label": "เหตุผล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเหตุผล"
      },
      {
        "id": "legal_sources",
        "label": "อำนาจตามกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุอำนาจตามกฎหมาย"
      },
      {
        "id": "field_05",
        "label": "รายชื่อผู้ได้รับแต่งตั้ง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุรายชื่อผู้ได้รับแต่งตั้ง"
      },
      {
        "id": "field_06",
        "label": "หน้าที่",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน้าที่"
      },
      {
        "id": "field_07",
        "label": "วันมีผล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวันมีผล"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp010",
    "gp_code": "GP010",
    "name": "จัดทำคำสั่งและประกาศราชการ",
    "description": "ตรวจอำนาจและจัดทำคำสั่งหรือประกาศของ อปท.",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP010 — จัดทำคำสั่งและประกาศราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp011",
    "gp_code": "GP011",
    "name": "ร่างประกาศราชการ",
    "description": "ประกาศรับสมัคร กำหนดวัน หลักเกณฑ์ ผล หรือแจ้งประชาชน",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP011 — ร่างประกาศราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่อง"
      },
      {
        "id": "legal_sources",
        "label": "อำนาจตามกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุอำนาจตามกฎหมาย"
      },
      {
        "id": "field_04",
        "label": "เหตุผล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเหตุผล"
      },
      {
        "id": "field_05",
        "label": "รายละเอียดประกาศ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุรายละเอียดประกาศ"
      },
      {
        "id": "field_06",
        "label": "วันเริ่มใช้",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวันเริ่มใช้"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp012",
    "gp_code": "GP012",
    "name": "ร่างหนังสือแจ้งเวียน",
    "description": "สื่อสารภายในให้ชัดเจนและเข้าใจง่าย",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP012 — ร่างหนังสือแจ้งเวียน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp013",
    "gp_code": "GP013",
    "name": "จัดทำหนังสือเวียนภายในองค์กร",
    "description": "ใช้แจ้งแนวทางปฏิบัติ คำสั่ง หรือมาตรการภายใน",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP013 — จัดทำหนังสือเวียนภายในองค์กร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp014",
    "gp_code": "GP014",
    "name": "ร่างหนังสือขอความร่วมมือ",
    "description": "ขอความร่วมมือหน่วยงาน ประชาชน โรงเรียน หรือภาคเอกชน",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP014 — ร่างหนังสือขอความร่วมมือ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่อง"
      },
      {
        "id": "field_03",
        "label": "เรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรียน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริง"
      },
      {
        "id": "field_05",
        "label": "เหตุผล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเหตุผล"
      },
      {
        "id": "field_06",
        "label": "สิ่งที่ขอความร่วมมือ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุสิ่งที่ขอความร่วมมือ"
      },
      {
        "id": "expected_results",
        "label": "ผลที่คาดหวัง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลที่คาดหวัง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp015",
    "gp_code": "GP015",
    "name": "ร่างหนังสือเชิญประชุมแบบพื้นฐาน",
    "description": "จัดทำหนังสือเชิญพร้อมวัน เวลา สถานที่ และวาระ",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP015 — ร่างหนังสือเชิญประชุมแบบพื้นฐาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp016",
    "gp_code": "GP016",
    "name": "ร่างหนังสือเชิญประชุมคณะกรรมการหรือหน่วยงานภายนอก",
    "description": "ใช้เชิญคณะผู้บริหาร คณะกรรมการ หรือหน่วยงานภายนอก",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP016 — ร่างหนังสือเชิญประชุมคณะกรรมการหรือหน่วยงานภายนอก\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp017",
    "gp_code": "GP017",
    "name": "ร่างหนังสือเชิญประชุมฉบับครบถ้วน",
    "description": "เชิญคณะกรรมการ สภา หัวหน้าส่วน หรือคณะทำงาน",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP017 — ร่างหนังสือเชิญประชุมฉบับครบถ้วน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่อง"
      },
      {
        "id": "field_03",
        "label": "เรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรียน"
      },
      {
        "id": "datetime",
        "label": "วัน เวลา",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวัน เวลา"
      },
      {
        "id": "location",
        "label": "สถานที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุสถานที่"
      },
      {
        "id": "field_06",
        "label": "ระเบียบวาระ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุระเบียบวาระ"
      },
      {
        "id": "documents",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเอกสารประกอบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp018",
    "gp_code": "GP018",
    "name": "ตรวจแก้ภาษาราชการ",
    "description": "ปรับข้อความให้สุภาพ กระชับ และเป็นทางการ",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP018 — ตรวจแก้ภาษาราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp019",
    "gp_code": "GP019",
    "name": "ปรับแก้หนังสือราชการเดิม",
    "description": "ตรวจองค์ประกอบ ภาษา และลำดับเหตุผล",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP019 — ปรับแก้หนังสือราชการเดิม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp020",
    "gp_code": "GP020",
    "name": "ตรวจแก้และประเมินคุณภาพหนังสือราชการ",
    "description": "ตรวจรูปแบบ ภาษา เนื้อหา เหตุผล กฎหมาย และความเสี่ยง",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP020 — ตรวจแก้และประเมินคุณภาพหนังสือราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp021",
    "gp_code": "GP021",
    "name": "ตรวจความครบถ้วนเอกสาร",
    "description": "ค้นหาข้อมูลที่ขาด จุดผิดพลาด และความเสี่ยง",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP021 — ตรวจความครบถ้วนเอกสาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp022",
    "gp_code": "GP022",
    "name": "ตรวจความเสี่ยงของเอกสารราชการ",
    "description": "ใช้ตรวจเอกสารก่อนเสนอผู้บริหารหรือลงนาม",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP022 — ตรวจความเสี่ยงของเอกสารราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp023",
    "gp_code": "GP023",
    "name": "ตรวจภาษาราชการและความครบถ้วน",
    "description": "ตรวจภาษา ช่องว่างข้อมูล และจุดที่ต้องยืนยัน",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP023 — ตรวจภาษาราชการและความครบถ้วน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "draft",
        "label": "ข้อความต้นฉบับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุข้อความต้นฉบับ"
      },
      {
        "id": "documents",
        "label": "ประเภทเอกสารและผู้อ่าน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุประเภทเอกสารและผู้อ่าน"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุวัตถุประสงค์"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงที่ต้องคงไว้",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงที่ต้องคงไว้"
      },
      {
        "id": "field_05",
        "label": "จุดที่ผู้ใช้กังวล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุจุดที่ผู้ใช้กังวล"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp024",
    "gp_code": "GP024",
    "name": "ตรวจเอกสารก่อนเสนอผู้บริหาร",
    "description": "ตรวจความครบถ้วน ข้อเท็จจริง กฎหมาย ภาษา และความเสี่ยง",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP024 — ตรวจเอกสารก่อนเสนอผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp025",
    "gp_code": "GP025",
    "name": "วิเคราะห์หนังสือราชการก่อนลงนาม",
    "description": "ตรวจรูปแบบ ภาษา กฎหมาย อำนาจ ความเสี่ยง และผลกระทบ",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP025 — วิเคราะห์หนังสือราชการก่อนลงนาม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp026",
    "gp_code": "GP026",
    "name": "ร่างหนังสือตอบข้อร้องเรียน",
    "description": "ตอบอย่างสุภาพ เป็นกลาง และอธิบายเหตุผล",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP026 — ร่างหนังสือตอบข้อร้องเรียน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp027",
    "gp_code": "GP027",
    "name": "สรุปเอกสารจำนวนมาก",
    "description": "สกัดประเด็น ข้อเท็จจริง งานที่ต้องทำ และข้อเสนอ",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP027 — สรุปเอกสารจำนวนมาก\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อหน่วยงาน"
      },
      {
        "id": "document_type",
        "label": "ประเภทเอกสารหรือหนังสือ",
        "type": "text",
        "required": true,
        "placeholder": "เช่น หนังสือภายนอก บันทึกข้อความ คำสั่ง"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องให้ชัดเจน"
      },
      {
        "id": "recipient",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและเหตุผล",
        "type": "textarea",
        "required": true,
        "placeholder": "เรียงข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์หรือข้อเสนอ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสิ่งที่ต้องการให้ผู้รับดำเนินการ"
      },
      {
        "id": "references",
        "label": "เอกสารหรือข้อกฎหมายอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะข้อมูลที่มีจริง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp028",
    "gp_code": "GP028",
    "name": "ร่างคำสั่งแต่งตั้งคณะทำงาน",
    "description": "สร้างโครงคำสั่งและอำนาจหน้าที่",
    "group_code": "G01",
    "group_name": "งานสารบรรณและเอกสารราชการ",
    "preview": "GP028 — ร่างคำสั่งแต่งตั้งคณะทำงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานเจ้าของเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานเจ้าของเรื่อง"
      },
      {
        "id": "subject",
        "label": "ประเภทและชื่อเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทและชื่อเรื่อง"
      },
      {
        "id": "field_03",
        "label": "ผู้รับหรือผู้เกี่ยวข้อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้รับหรือผู้เกี่ยวข้อง"
      },
      {
        "id": "objective",
        "label": "ข้อเท็จจริงและวัตถุประสงค์",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงและวัตถุประสงค์"
      },
      {
        "id": "documents",
        "label": "เอกสารอ้างอิงหรือสิ่งที่ส่งมาด้วย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเอกสารอ้างอิงหรือสิ่งที่ส่งมาด้วย"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp029",
    "gp_code": "GP029",
    "name": "สรุปเรื่องเสนอผู้บริหารภายใน 3 นาที",
    "description": "สรุปอ่านจบภายใน 3 นาที",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP029 — สรุปเรื่องเสนอผู้บริหารภายใน 3 นาที\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp030",
    "gp_code": "GP030",
    "name": "สรุปข้อมูลเสนอผู้บริหารใน 1 หน้า",
    "description": "สรุปสถานการณ์ ความเสี่ยง และสิ่งที่ต้องตัดสินใจ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP030 — สรุปข้อมูลเสนอผู้บริหารใน 1 หน้า\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "field_01",
        "label": "ผู้รับสรุป",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้รับสรุป"
      },
      {
        "id": "subject",
        "label": "เรื่องและสถานการณ์",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องและสถานการณ์"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงสำคัญ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงสำคัญ"
      },
      {
        "id": "field_04",
        "label": "ประเด็นที่ต้องตัดสินใจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องตัดสินใจ"
      },
      {
        "id": "documents",
        "label": "ข้อจำกัดและเอกสารประกอบ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อจำกัดและเอกสารประกอบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp031",
    "gp_code": "GP031",
    "name": "จัดทำสรุปย่อเพื่อการตัดสินใจของผู้บริหาร",
    "description": "ใช้สรุปเรื่องสำคัญให้ผู้บริหารตัดสินใจเร็ว",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP031 — จัดทำสรุปย่อเพื่อการตัดสินใจของผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp032",
    "gp_code": "GP032",
    "name": "สรุปเอกสารให้ผู้บริหารอ่านภายใน 5 นาที",
    "description": "แบ่งข้อมูลเป็น ข้อมูลที่ต้องรู้, ข้อมูลเสริม และอ่านเพิ่มเติม",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP032 — สรุปเอกสารให้ผู้บริหารอ่านภายใน 5 นาที\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp033",
    "gp_code": "GP033",
    "name": "สรุปรายงานประชุมและติดตามงาน",
    "description": "มติ ผู้รับผิดชอบ กำหนดเวลา และสถานะ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP033 — สรุปรายงานประชุมและติดตามงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp034",
    "gp_code": "GP034",
    "name": "สรุปรายงานการประชุมพร้อมติดตามมติ",
    "description": "สกัดมติ ผู้รับผิดชอบ และกำหนดเวลา",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP034 — สรุปรายงานการประชุมพร้อมติดตามมติ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "objective",
        "label": "ชื่อและวัตถุประสงค์การประชุม",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุชื่อและวัตถุประสงค์การประชุม"
      },
      {
        "id": "datetime",
        "label": "วัน เวลา สถานที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวัน เวลา สถานที่"
      },
      {
        "id": "participants",
        "label": "ผู้เข้าร่วม",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผู้เข้าร่วม"
      },
      {
        "id": "field_04",
        "label": "วาระหรือประเด็นหารือ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวาระหรือประเด็นหารือ"
      },
      {
        "id": "field_05",
        "label": "ข้อสรุปหรือมติที่มีหลักฐาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุข้อสรุปหรือมติที่มีหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp035",
    "gp_code": "GP035",
    "name": "สรุปมติประชุมแบบย่อพร้อมผู้รับผิดชอบและกำหนดเวลา",
    "description": "สรุปสาระ มติ ผู้รับผิดชอบ และกำหนดเวลา",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP035 — สรุปมติประชุมแบบย่อพร้อมผู้รับผิดชอบและกำหนดเวลา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp036",
    "gp_code": "GP036",
    "name": "จัดทำระเบียบวาระการประชุม",
    "description": "จัดวาระแจ้งเพื่อทราบและพิจารณา",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP036 — จัดทำระเบียบวาระการประชุม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "objective",
        "label": "ชื่อและวัตถุประสงค์การประชุม",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุชื่อและวัตถุประสงค์การประชุม"
      },
      {
        "id": "datetime",
        "label": "วัน เวลา สถานที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวัน เวลา สถานที่"
      },
      {
        "id": "participants",
        "label": "ผู้เข้าร่วม",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผู้เข้าร่วม"
      },
      {
        "id": "field_04",
        "label": "วาระหรือประเด็นหารือ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวาระหรือประเด็นหารือ"
      },
      {
        "id": "field_05",
        "label": "ข้อสรุปหรือมติที่มีหลักฐาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุข้อสรุปหรือมติที่มีหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp037",
    "gp_code": "GP037",
    "name": "เลขานุการส่วนตัวและบันทึกกำหนดการในปฏิทินกูเกิล",
    "description": "อ่านตารางงาน ตรวจวันเวลา รายการซ้ำ และเพิ่มกิจกรรมพร้อมการแจ้งเตือน",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP037 — เลขานุการส่วนตัวและบันทึกกำหนดการในปฏิทินกูเกิล\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp038",
    "gp_code": "GP038",
    "name": "ติดตามข้อสั่งการของผู้บริหาร",
    "description": "ใช้ติดตามงานหลังประชุมหรือหลังผู้บริหารสั่งการ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP038 — ติดตามข้อสั่งการของผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp039",
    "gp_code": "GP039",
    "name": "จัดทำลำดับเวลางานราชการ",
    "description": "ใช้วางแผนโครงการ การประชุม หรือภารกิจเร่งด่วน",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP039 — จัดทำลำดับเวลางานราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp040",
    "gp_code": "GP040",
    "name": "จัดทำรายการตรวจสอบงานราชการ",
    "description": "ใช้ลดข้อผิดพลาดและทำให้งานตรวจสอบย้อนหลังได้",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP040 — จัดทำรายการตรวจสอบงานราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp041",
    "gp_code": "GP041",
    "name": "ผู้ช่วยเลขานุการผู้บริหาร",
    "description": "สร้างระบบช่วยงานปลัด รองปลัด และหัวหน้าส่วนราชการ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP041 — ผู้ช่วยเลขานุการผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp042",
    "gp_code": "GP042",
    "name": "สรุปรายงานเป็นอินโฟกราฟิกผู้บริหาร 1 หน้า",
    "description": "สรุปรายงานให้ผู้บริหารอ่านจบภายใน 3 นาที",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP042 — สรุปรายงานเป็นอินโฟกราฟิกผู้บริหาร 1 หน้า\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp043",
    "gp_code": "GP043",
    "name": "ประเด็นที่ผู้บริหารต้องตัดสินใจ",
    "description": "คัดเฉพาะเรื่องที่ต้องตัดสินใจพร้อมทางเลือกและผลกระทบ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP043 — ประเด็นที่ผู้บริหารต้องตัดสินใจ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp044",
    "gp_code": "GP044",
    "name": "สรุป 10 ข้อค้นพบสำคัญจากรายงาน",
    "description": "สกัดข้อค้นพบที่มีผลต่อภารกิจและประชาชนมากที่สุด",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP044 — สรุป 10 ข้อค้นพบสำคัญจากรายงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp045",
    "gp_code": "GP045",
    "name": "จัดทำหน้าสรุปข้อมูลสำหรับผู้บริหาร อปท.",
    "description": "สรุป ตัวชี้วัดผลสำเร็จ งบประมาณ ความก้าวหน้า ความเสี่ยง และเรื่องเร่งด่วน",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP045 — จัดทำหน้าสรุปข้อมูลสำหรับผู้บริหาร อปท.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp046",
    "gp_code": "GP046",
    "name": "จัดทำหน้าสรุปความเสี่ยงสำหรับผู้บริหาร",
    "description": "จัดระดับความเสี่ยง ผลกระทบ ความเร่งด่วน และมาตรการควบคุม",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP046 — จัดทำหน้าสรุปความเสี่ยงสำหรับผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp047",
    "gp_code": "GP047",
    "name": "จัดทำลำดับเหตุการณ์สำคัญ",
    "description": "เรียงเหตุการณ์ ผลกระทบ การตัดสินใจ และงานถัดไปตามเวลา",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP047 — จัดทำลำดับเหตุการณ์สำคัญ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp048",
    "gp_code": "GP048",
    "name": "เปรียบเทียบสถานการณ์ก่อนและหลัง",
    "description": "เปรียบเทียบสภาพก่อนและหลังด้วยเกณฑ์เดียวกัน",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP048 — เปรียบเทียบสถานการณ์ก่อนและหลัง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp049",
    "gp_code": "GP049",
    "name": "สรุปตัวชี้วัดผลสำเร็จ",
    "description": "สรุป ตัวชี้วัดผลสำเร็จ เป้าหมาย ผลจริง ส่วนต่าง สถานะ และข้อเสนอ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP049 — สรุปตัวชี้วัดผลสำเร็จ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp050",
    "gp_code": "GP050",
    "name": "จัดทำอินโฟกราฟิกแผนปฏิบัติงาน",
    "description": "แปลงข้อเสนอเป็นงาน ผู้รับผิดชอบ กำหนดเวลา และผลลัพธ์",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP050 — จัดทำอินโฟกราฟิกแผนปฏิบัติงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp051",
    "gp_code": "GP051",
    "name": "จัดทำตารางเปรียบเทียบทางเลือกเพื่อการตัดสินใจ",
    "description": "เปรียบเทียบทางเลือกตามเกณฑ์เดียวกันเพื่อประกอบการตัดสินใจ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP051 — จัดทำตารางเปรียบเทียบทางเลือกเพื่อการตัดสินใจ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp052",
    "gp_code": "GP052",
    "name": "สรุปข้อมูลสำหรับประชุมผู้บริหาร",
    "description": "เตรียมข้อมูลสำหรับคณะกรรมการหรือที่ประชุมผู้บริหาร",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP052 — สรุปข้อมูลสำหรับประชุมผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp053",
    "gp_code": "GP053",
    "name": "ช่วยผู้บริหารฝ่ายประจำวิเคราะห์และติดตามงาน",
    "description": "วิเคราะห์งานบริหาร กลั่นกรองข้อราชการ และจัดทำข้อเสนอสำหรับปลัด รองปลัด และหัวหน้าส่วนราชการ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP053 — ช่วยผู้บริหารฝ่ายประจำวิเคราะห์และติดตามงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp054",
    "gp_code": "GP054",
    "name": "ช่วยผู้บริหารฝ่ายการเมืองวิเคราะห์และสื่อสารนโยบาย",
    "description": "วิเคราะห์นโยบาย ผลกระทบ ความเสี่ยง และทางเลือกประกอบการตัดสินใจสำหรับนายกและคณะผู้บริหารท้องถิ่น",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP054 — ช่วยผู้บริหารฝ่ายการเมืองวิเคราะห์และสื่อสารนโยบาย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp055",
    "gp_code": "GP055",
    "name": "เตรียมการประชุมสภาท้องถิ่น",
    "description": "สรุปวาระ คาดคำถาม เตรียมข้อมูลสนับสนุน และประเมินความเสี่ยง",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP055 — เตรียมการประชุมสภาท้องถิ่น\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp056",
    "gp_code": "GP056",
    "name": "เตรียมคำตอบกระทู้และข้อหารือ",
    "description": "ร่างคำตอบพร้อมเหตุผล ฐานกฎหมาย และข้อควรระวัง",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP056 — เตรียมคำตอบกระทู้และข้อหารือ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp057",
    "gp_code": "GP057",
    "name": "ผู้ช่วยเตรียมประชุมผู้บริหาร",
    "description": "เตรียมข้อมูลตัดสินใจ ทางเลือก ความเสี่ยง คำถาม และคำตอบ",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP057 — ผู้ช่วยเตรียมประชุมผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp058",
    "gp_code": "GP058",
    "name": "ที่ปรึกษาหลักสำหรับผู้บริหารภาครัฐ",
    "description": "ที่ปรึกษาภาครัฐครบวงจรสำหรับการตัดสินใจระดับบริหาร",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP058 — ที่ปรึกษาหลักสำหรับผู้บริหารภาครัฐ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp059",
    "gp_code": "GP059",
    "name": "ผู้ช่วยงานภาครัฐอเนกประสงค์",
    "description": "แม่แบบกลางสำหรับหนังสือ รายงาน ตาราง รายการตรวจสอบ และสคริปต์",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP059 — ผู้ช่วยงานภาครัฐอเนกประสงค์\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp060",
    "gp_code": "GP060",
    "name": "ร่างคำกล่าวหรือสคริปต์ผู้บริหาร",
    "description": "คำกล่าว 3/5/10 นาทีพร้อมหัวข้อถือพูด",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP060 — ร่างคำกล่าวหรือสคริปต์ผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp061",
    "gp_code": "GP061",
    "name": "จัดทำแผนผังโอกาสและแนวทางพัฒนา",
    "description": "จัดโอกาสพัฒนาเป็น งานที่ทำได้เร็วและเห็นผล ระยะกลาง และระยะยาว",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP061 — จัดทำแผนผังโอกาสและแนวทางพัฒนา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp062",
    "gp_code": "GP062",
    "name": "วิเคราะห์จุดแข็ง จุดอ่อน โอกาส และอุปสรรค",
    "description": "วิเคราะห์จุดแข็ง จุดอ่อน โอกาส อุปสรรค และข้อเสนอเชิงกลยุทธ์",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP062 — วิเคราะห์จุดแข็ง จุดอ่อน โอกาส และอุปสรรค\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp063",
    "gp_code": "GP063",
    "name": "อินโฟกราฟิกประเด็นตัดสินใจสำหรับผู้บริหาร",
    "description": "สรุปสถานการณ์ ตัวเลข ข้อค้นพบสำคัญ ความเสี่ยง และ ขั้นตอนถัดไป ในหน้าเดียว",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP063 — อินโฟกราฟิกประเด็นตัดสินใจสำหรับผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp064",
    "gp_code": "GP064",
    "name": "จัดทำเอกสารสรุปเชิงนโยบาย",
    "description": "สรุปปัญหา ทางเลือก และข้อเสนอเชิงนโยบาย",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP064 — จัดทำเอกสารสรุปเชิงนโยบาย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "field_01",
        "label": "ผู้รับสรุป",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้รับสรุป"
      },
      {
        "id": "subject",
        "label": "เรื่องและสถานการณ์",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องและสถานการณ์"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงสำคัญ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงสำคัญ"
      },
      {
        "id": "field_04",
        "label": "ประเด็นที่ต้องตัดสินใจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องตัดสินใจ"
      },
      {
        "id": "documents",
        "label": "ข้อจำกัดและเอกสารประกอบ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อจำกัดและเอกสารประกอบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp065",
    "gp_code": "GP065",
    "name": "วิเคราะห์ข่าวและผลกระทบต่อ อปท.",
    "description": "ประเมินผลกระทบ ความเสี่ยง โอกาส และการเตรียมความพร้อม",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP065 — วิเคราะห์ข่าวและผลกระทบต่อ อปท.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp066",
    "gp_code": "GP066",
    "name": "ผู้ช่วยงานภาครัฐครบวงจรสำหรับ อปท.",
    "description": "ผู้ช่วยวิเคราะห์งาน อปท. แบบครบวงจร โดยเจ้าหน้าที่ตัดสินใจขั้นสุดท้าย",
    "group_code": "G02",
    "group_name": "งานประชุม เลขานุการ และสนับสนุนผู้บริหาร",
    "preview": "GP066 — ผู้ช่วยงานภาครัฐครบวงจรสำหรับ อปท.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "topic",
        "label": "เรื่องหรือภารกิจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "audience",
        "label": "ผู้บริหารหรือผู้รับข้อมูล",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตำแหน่งหรือกลุ่มผู้ใช้ผลลัพธ์"
      },
      {
        "id": "facts",
        "label": "ข้อมูลและข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลต้นฉบับ"
      },
      {
        "id": "decision",
        "label": "ประเด็นต้องตัดสินใจหรือมติ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะที่มีข้อมูล"
      },
      {
        "id": "timeline",
        "label": "กำหนดเวลาและผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัน เวลา ผู้รับผิดชอบ"
      },
      {
        "id": "attachments",
        "label": "เอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายการเอกสารหรือหลักฐาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp067",
    "gp_code": "GP067",
    "name": "วิเคราะห์ข้อกฎหมายและอำนาจหน้าที่",
    "description": "อำนาจ เงื่อนไข ทางเลือก และความเสี่ยง",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP067 — วิเคราะห์ข้อกฎหมายและอำนาจหน้าที่\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp068",
    "gp_code": "GP068",
    "name": "วิเคราะห์ข้อกฎหมายสำหรับผู้บริหาร อปท.",
    "description": "ใช้ก่อนตัดสินใจเรื่องอำนาจ งบประมาณ โครงการ หรือข้อพิพาท",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP068 — วิเคราะห์ข้อกฎหมายสำหรับผู้บริหาร อปท.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp069",
    "gp_code": "GP069",
    "name": "วิเคราะห์อำนาจหน้าที่ อปท.",
    "description": "ตรวจว่า อบจ. เทศบาล หรือ อบต. ดำเนินโครงการได้หรือไม่",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP069 — วิเคราะห์อำนาจหน้าที่ อปท.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp070",
    "gp_code": "GP070",
    "name": "จัดทำ ความเห็นทางกฎหมาย",
    "description": "จัดทำความเห็นนิติกรเพื่อเสนอผู้บริหาร",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP070 — จัดทำ ความเห็นทางกฎหมาย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp071",
    "gp_code": "GP071",
    "name": "ร่างหนังสือหารือแบบกระชับ",
    "description": "ข้อเท็จจริง เหตุสงสัย และประเด็นหารือ",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP071 — ร่างหนังสือหารือแบบกระชับ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp072",
    "gp_code": "GP072",
    "name": "ร่างหนังสือหารือพร้อมวิเคราะห์ข้อกฎหมาย",
    "description": "วิเคราะห์ข้อเท็จจริง อำนาจ ความเสี่ยง และจัดทำคำถามหารือ",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP072 — ร่างหนังสือหารือพร้อมวิเคราะห์ข้อกฎหมาย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp073",
    "gp_code": "GP073",
    "name": "ร่างหนังสือหารือข้อกฎหมายแบบมีประเด็นวินิจฉัย",
    "description": "จัดทำหนังสือหารือหน่วยงานกำกับด้วยคำถามเฉพาะเจาะจง",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP073 — ร่างหนังสือหารือข้อกฎหมายแบบมีประเด็นวินิจฉัย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp074",
    "gp_code": "GP074",
    "name": "ตรวจร่างคำสั่งทางปกครอง",
    "description": "อำนาจ ขั้นตอน เหตุผล การรับฟัง และอุทธรณ์",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP074 — ตรวจร่างคำสั่งทางปกครอง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp075",
    "gp_code": "GP075",
    "name": "วิเคราะห์อำนาจหน้าที่แบบครบวงจร",
    "description": "วิเคราะห์อำนาจ ข้อจำกัด แนวคำวินิจฉัย ความเสี่ยง และทางดำเนินการ",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP075 — วิเคราะห์อำนาจหน้าที่แบบครบวงจร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp076",
    "gp_code": "GP076",
    "name": "วิเคราะห์คำสั่งทางปกครอง",
    "description": "ตรวจอำนาจ ขั้นตอน การรับฟัง เหตุผล และความเสี่ยงถูกเพิกถอน",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP076 — วิเคราะห์คำสั่งทางปกครอง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp077",
    "gp_code": "GP077",
    "name": "วิเคราะห์การเพิกถอนคำสั่ง",
    "description": "วิเคราะห์คำสั่งเดิม เหตุเพิกถอน ผลกระทบ และความเสี่ยงคดี",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP077 — วิเคราะห์การเพิกถอนคำสั่ง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp078",
    "gp_code": "GP078",
    "name": "วิเคราะห์หนังสือหารือ",
    "description": "จัดข้อเท็จจริง ข้อกฎหมาย ประเด็นไม่ชัด และคำถามหารือ",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP078 — วิเคราะห์หนังสือหารือ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp079",
    "gp_code": "GP079",
    "name": "วิเคราะห์คดีปกครอง",
    "description": "ตรวจคำสั่ง ขั้นตอน ความเสี่ยง และทางป้องกันข้อพิพาท",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP079 — วิเคราะห์คดีปกครอง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp080",
    "gp_code": "GP080",
    "name": "ตรวจร่างระเบียบหรือประกาศ",
    "description": "ตรวจอำนาจ ความสอดคล้อง ถ้อยคำ ช่องว่าง และข้อเสนอแก้ไข",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP080 — ตรวจร่างระเบียบหรือประกาศ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp081",
    "gp_code": "GP081",
    "name": "ตรวจอำนาจลงนาม",
    "description": "ตรวจอำนาจ การมอบอำนาจ และความเสี่ยงก่อนลงนาม",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP081 — ตรวจอำนาจลงนาม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp082",
    "gp_code": "GP082",
    "name": "ออกแบบขั้นตอนกระบวนงานด้านกฎหมาย",
    "description": "จัดลำดับขั้นตอน ผู้รับผิดชอบ เอกสาร และจุดควบคุมความเสี่ยง",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP082 — ออกแบบขั้นตอนกระบวนงานด้านกฎหมาย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp083",
    "gp_code": "GP083",
    "name": "วิเคราะห์ข้อพิพาทกับเอกชน",
    "description": "เปรียบเทียบทางเลือก ความเสี่ยง และแนวทางเจรจา",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP083 — วิเคราะห์ข้อพิพาทกับเอกชน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp084",
    "gp_code": "GP084",
    "name": "ที่ปรึกษากฎหมายสำหรับผู้บริหาร",
    "description": "วิเคราะห์ข้อกฎหมายและความเสี่ยงสำหรับปลัด อปท. เพื่อประกอบการตัดสินใจ",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP084 — ที่ปรึกษากฎหมายสำหรับผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp085",
    "gp_code": "GP085",
    "name": "วิเคราะห์คดีปกครองแบบครบวงจร",
    "description": "วิเคราะห์ข้อพิพาท กฎหมาย จุดแข็ง จุดอ่อน และความเสี่ยงคดี",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP085 — วิเคราะห์คดีปกครองแบบครบวงจร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp086",
    "gp_code": "GP086",
    "name": "วิเคราะห์สัญญาของหน่วยงานแบบสรุป",
    "description": "ตรวจสิทธิหน้าที่ ค่าปรับ รับประกัน บอกเลิก และข้อพิพาท",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP086 — วิเคราะห์สัญญาของหน่วยงานแบบสรุป\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp087",
    "gp_code": "GP087",
    "name": "จัดประเด็นข้อเท็จจริงและข้อกฎหมาย",
    "description": "แยกข้อเท็จจริง ประเด็น และกฎหมายที่ต้องตรวจ",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP087 — จัดประเด็นข้อเท็จจริงและข้อกฎหมาย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและผู้เกี่ยวข้อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและผู้เกี่ยวข้อง"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงเรียงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงเรียงตามลำดับเวลา"
      },
      {
        "id": "legal_sources",
        "label": "คำถามหรือประเด็นข้อกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุคำถามหรือประเด็นข้อกฎหมาย"
      },
      {
        "id": "documents",
        "label": "เอกสารและหลักฐาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเอกสารและหลักฐาน"
      },
      {
        "id": "legal_sources_5",
        "label": "กฎหมายหรือระเบียบที่มีอยู่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกฎหมายหรือระเบียบที่มีอยู่"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp088",
    "gp_code": "GP088",
    "name": "ตรวจบันทึกข้อตกลงระหว่างหน่วยงาน",
    "description": "ตรวจอำนาจ ภาระผูกพัน งบประมาณ ทรัพย์สิน และความเสี่ยง",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP088 — ตรวจบันทึกข้อตกลงระหว่างหน่วยงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp089",
    "gp_code": "GP089",
    "name": "ตรวจสัญญาทางราชการด้านสิทธิ หน้าที่ และความเสี่ยง",
    "description": "ตรวจสิทธิหน้าที่ เงื่อนไข ความรับผิด การผิดสัญญา และความเสี่ยง",
    "group_code": "G03",
    "group_name": "งานกฎหมาย นิติการ และคำสั่งทางปกครอง",
    "preview": "GP089 — ตรวจสัญญาทางราชการด้านสิทธิ หน้าที่ และความเสี่ยง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "issue",
        "label": "เรื่องหรือประเด็นกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องวิเคราะห์"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและฐานะของคู่กรณี",
        "type": "text",
        "required": false,
        "placeholder": "เช่น อบจ. เทศบาล อบต. คู่สัญญา"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงที่ยืนยันได้"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือเอกสารอ้างอิง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเฉพาะฉบับที่มีข้อมูล"
      },
      {
        "id": "question",
        "label": "ข้อสงสัยหรือประเด็นวินิจฉัย",
        "type": "textarea",
        "required": true,
        "placeholder": "ตั้งคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "impact",
        "label": "ผลกระทบและความเร่งด่วน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผลต่อสิทธิ งบประมาณ หรือการดำเนินงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp090",
    "gp_code": "GP090",
    "name": "จัดการเรื่องร้องเรียน",
    "description": "ตรวจข้อเท็จจริงอย่างเป็นธรรมและร่างคำตอบ",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP090 — จัดการเรื่องร้องเรียน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp091",
    "gp_code": "GP091",
    "name": "วิเคราะห์ข้อร้องเรียนเกี่ยวกับบุคลากร อปท.",
    "description": "แยกข้อกล่าวหา ข้อเท็จจริง พยานหลักฐาน ขั้นตอน และสิทธิของผู้เกี่ยวข้องอย่างเป็นธรรม",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP091 — วิเคราะห์ข้อร้องเรียนเกี่ยวกับบุคลากร อปท.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "ผู้ร้อง/ช่องทางรับเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้ร้อง/ช่องทางรับเรื่อง"
      },
      {
        "id": "field_03",
        "label": "ผู้ถูกร้อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้ถูกร้อง"
      },
      {
        "id": "field_04",
        "label": "ข้อกล่าวหา",
        "type": "text",
        "required": true,
        "placeholder": "ระบุข้อกล่าวหา"
      },
      {
        "id": "datetime",
        "label": "วัน เวลา สถานที่ และลำดับเหตุการณ์",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวัน เวลา สถานที่ และลำดับเหตุการณ์"
      },
      {
        "id": "documents",
        "label": "เอกสารหรือพยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเอกสารหรือพยานหลักฐานที่มี"
      },
      {
        "id": "field_07",
        "label": "การดำเนินการที่ผ่านมา",
        "type": "text",
        "required": false,
        "placeholder": "ระบุการดำเนินการที่ผ่านมา"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp092",
    "gp_code": "GP092",
    "name": "ประเมินภาระงานและวางแผนอัตรากำลัง",
    "description": "งานจำเป็น งานซ้ำ และการจัดคน",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP092 — ประเมินภาระงานและวางแผนอัตรากำลัง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp093",
    "gp_code": "GP093",
    "name": "ร่างคำสั่งแต่งตั้งคณะกรรมการ",
    "description": "ตรวจอำนาจ รายชื่อ หน้าที่ และระยะเวลาปฏิบัติงานก่อนร่างคำสั่ง",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP093 — ร่างคำสั่งแต่งตั้งคณะกรรมการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่อง"
      },
      {
        "id": "legal_sources",
        "label": "อำนาจตามกฎหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุอำนาจตามกฎหมาย"
      },
      {
        "id": "field_04",
        "label": "เหตุผล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเหตุผล"
      },
      {
        "id": "field_05",
        "label": "รายชื่อคณะกรรมการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุรายชื่อคณะกรรมการ"
      },
      {
        "id": "field_06",
        "label": "หน้าที่",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน้าที่"
      },
      {
        "id": "field_07",
        "label": "ระยะเวลาปฏิบัติงาน",
        "type": "text",
        "required": false,
        "placeholder": "ระบุระยะเวลาปฏิบัติงาน"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp094",
    "gp_code": "GP094",
    "name": "ร่างคำสั่งมอบหมายหน้าที่",
    "description": "กำหนดผู้รับมอบหมาย ขอบเขตหน้าที่ ระยะเวลา และความรับผิดชอบ",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP094 — ร่างคำสั่งมอบหมายหน้าที่\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "เรื่องและเหตุผล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องและเหตุผล"
      },
      {
        "id": "field_03",
        "label": "ฐานอำนาจ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุฐานอำนาจ"
      },
      {
        "id": "field_04",
        "label": "ผู้ได้รับมอบหมายและตำแหน่ง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้ได้รับมอบหมายและตำแหน่ง"
      },
      {
        "id": "field_05",
        "label": "หน้าที่/ขอบเขตงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุหน้าที่/ขอบเขตงาน"
      },
      {
        "id": "field_06",
        "label": "ระยะเวลา",
        "type": "text",
        "required": false,
        "placeholder": "ระบุระยะเวลา"
      },
      {
        "id": "field_07",
        "label": "ผู้กำกับติดตาม",
        "type": "text",
        "required": false,
        "placeholder": "ระบุผู้กำกับติดตาม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp095",
    "gp_code": "GP095",
    "name": "ประเมินผลการปฏิบัติงาน",
    "description": "สรุปผลงาน พฤติกรรม จุดเด่น ช่องว่าง และข้อเสนอพัฒนา",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP095 — ประเมินผลการปฏิบัติงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "field_01",
        "label": "รอบการประเมิน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุรอบการประเมิน"
      },
      {
        "id": "field_02",
        "label": "ตำแหน่ง/หน้าที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุตำแหน่ง/หน้าที่"
      },
      {
        "id": "field_03",
        "label": "เป้าหมายและตัวชี้วัด",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเป้าหมายและตัวชี้วัด"
      },
      {
        "id": "field_04",
        "label": "ผลงานและหลักฐาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผลงานและหลักฐาน"
      },
      {
        "id": "field_05",
        "label": "พฤติกรรม/สมรรถนะ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุพฤติกรรม/สมรรถนะ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp096",
    "gp_code": "GP096",
    "name": "จัดทำแผนพัฒนารายบุคคล",
    "description": "เชื่อมสมรรถนะ ช่องว่าง เป้าหมาย กิจกรรม เวลา และตัวชี้วัด",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP096 — จัดทำแผนพัฒนารายบุคคล\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp097",
    "gp_code": "GP097",
    "name": "จัดทำแผนอัตรากำลัง",
    "description": "วิเคราะห์ภารกิจ โครงสร้าง ภาระงาน อัตรากำลัง และความจำเป็น",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP097 — จัดทำแผนอัตรากำลัง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp098",
    "gp_code": "GP098",
    "name": "ผู้ช่วยงานบุคคลครบวงจร",
    "description": "ผู้ช่วยงานบุคคล วินัย ประเมิน คำสั่ง แต่งตั้ง โอน ย้าย และพัฒนา",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP098 — ผู้ช่วยงานบุคคลครบวงจร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp099",
    "gp_code": "GP099",
    "name": "วิเคราะห์วินัยและจริยธรรม",
    "description": "ข้อเท็จจริง มาตรฐาน ฐานวินัย และความได้สัดส่วน",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP099 — วิเคราะห์วินัยและจริยธรรม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp100",
    "gp_code": "GP100",
    "name": "วิเคราะห์ความผิดทางวินัย",
    "description": "ประเมินพฤติการณ์ก่อนดำเนินการทางวินัย",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP100 — วิเคราะห์ความผิดทางวินัย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp101",
    "gp_code": "GP101",
    "name": "ร่างคำสั่งสอบข้อเท็จจริง",
    "description": "แต่งตั้งคณะกรรมการ กำหนดขอบเขต หน้าที่ และระยะเวลา",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP101 — ร่างคำสั่งสอบข้อเท็จจริง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp102",
    "gp_code": "GP102",
    "name": "วิเคราะห์ข้อร้องเรียนเชิงกฎหมาย",
    "description": "วิเคราะห์สิทธิ ประเด็นกฎหมาย วิธีตรวจสอบ และคำตอบที่เป็นธรรม",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP102 — วิเคราะห์ข้อร้องเรียนเชิงกฎหมาย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp103",
    "gp_code": "GP103",
    "name": "วิเคราะห์วินัยข้าราชการ",
    "description": "แยกข้อเท็จจริง ข้อกฎหมาย ฐานความผิด หลักฐาน และความเสี่ยง",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP103 — วิเคราะห์วินัยข้าราชการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp104",
    "gp_code": "GP104",
    "name": "ร่างหนังสือแจ้งสิทธิ",
    "description": "อธิบายสิทธิ หน้าที่ ระยะเวลา และช่องทางดำเนินการด้วยภาษาชัดเจน",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP104 — ร่างหนังสือแจ้งสิทธิ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp105",
    "gp_code": "GP105",
    "name": "ร่างหนังสือเชิญชี้แจง",
    "description": "เชิญผู้เกี่ยวข้องชี้แจงข้อเท็จจริงอย่างเป็นกลางและเป็นธรรม",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP105 — ร่างหนังสือเชิญชี้แจง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "subject",
        "label": "เรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่อง"
      },
      {
        "id": "field_02",
        "label": "ผู้ถูกเชิญ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้ถูกเชิญ"
      },
      {
        "id": "field_03",
        "label": "เหตุผล/ประเด็นที่ต้องชี้แจง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเหตุผล/ประเด็นที่ต้องชี้แจง"
      },
      {
        "id": "datetime",
        "label": "วัน เวลา และสถานที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวัน เวลา และสถานที่"
      },
      {
        "id": "documents",
        "label": "เอกสารที่ให้นำมา",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเอกสารที่ให้นำมา"
      },
      {
        "id": "field_06",
        "label": "สิทธิของผู้เกี่ยวข้อง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุสิทธิของผู้เกี่ยวข้อง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp106",
    "gp_code": "GP106",
    "name": "วิเคราะห์สำนวนวินัย",
    "description": "สร้างแผนผังข้อกล่าวหา หลักฐาน ข้อกฎหมาย และช่องว่างสำนวน",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP106 — วิเคราะห์สำนวนวินัย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp107",
    "gp_code": "GP107",
    "name": "ตอบคำถามวินัยข้าราชการท้องถิ่น",
    "description": "ตอบคำถามวินัยโดยแยกข้อเท็จจริง หลักเกณฑ์ ข้อจำกัด ความเสี่ยง และขั้นตอนต่อไป",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP107 — ตอบคำถามวินัยข้าราชการท้องถิ่น\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "field_01",
        "label": "ประเภทบุคลากรและประเภท อปท.",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทบุคลากรและประเภท อปท."
      },
      {
        "id": "field_02",
        "label": "คำถาม",
        "type": "text",
        "required": true,
        "placeholder": "ระบุคำถาม"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงตามลำดับเวลา",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงตามลำดับเวลา"
      },
      {
        "id": "field_04",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขั้นตอนที่ดำเนินการแล้ว"
      },
      {
        "id": "documents",
        "label": "คำสั่ง/เอกสาร/พยานหลักฐาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุคำสั่ง/เอกสาร/พยานหลักฐาน"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย ระเบียบ หรือประกาศที่มี",
        "type": "text",
        "required": false,
        "placeholder": "ระบุกฎหมาย ระเบียบ หรือประกาศที่มี"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp108",
    "gp_code": "GP108",
    "name": "สร้างบทเรียนวินัยและกรณีศึกษา",
    "description": "แปลงเอกสารหรือกรณีวินัยเป็นบทเรียน ถาม–ตอบ ลำดับเวลา จุดเสี่ยง และ รายการตรวจสอบ โดยปกปิดข้อมูลส่วนบุคคล",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP108 — สร้างบทเรียนวินัยและกรณีศึกษา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "objective",
        "label": "วัตถุประสงค์การเรียนรู้",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุวัตถุประสงค์การเรียนรู้"
      },
      {
        "id": "facts",
        "label": "เอกสารต้นฉบับหรือข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเอกสารต้นฉบับหรือข้อเท็จจริง"
      },
      {
        "id": "legal_sources",
        "label": "กฎหมาย/ประกาศ/มติที่ใช้",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกฎหมาย/ประกาศ/มติที่ใช้"
      },
      {
        "id": "field_04",
        "label": "ระดับความยากและความยาว",
        "type": "text",
        "required": true,
        "placeholder": "ระบุระดับความยากและความยาว"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp109",
    "gp_code": "GP109",
    "name": "สรุปผลการปฏิบัติงานบุคลากร",
    "description": "จัดผลงาน ตัวชี้วัด และแผนพัฒนา",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP109 — สรุปผลการปฏิบัติงานบุคลากร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและตำแหน่ง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและตำแหน่ง"
      },
      {
        "id": "field_02",
        "label": "รอบหรือช่วงเวลาประเมิน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุรอบหรือช่วงเวลาประเมิน"
      },
      {
        "id": "field_03",
        "label": "หน้าที่และเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน้าที่และเป้าหมาย"
      },
      {
        "id": "field_04",
        "label": "ผลงานและหลักฐาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผลงานและหลักฐาน"
      },
      {
        "id": "field_05",
        "label": "ประเด็นพัฒนา",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นพัฒนา"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp110",
    "gp_code": "GP110",
    "name": "วิเคราะห์ข้อร้องเรียน",
    "description": "สรุปข้อร้องเรียน ประเด็นตรวจสอบ หน่วยงานเกี่ยวข้อง และแนวตอบ",
    "group_code": "G04",
    "group_name": "งานบุคคล วินัย จริยธรรม และเรื่องร้องเรียน",
    "preview": "GP110 — วิเคราะห์ข้อร้องเรียน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "case",
        "label": "เรื่องบุคคล วินัย หรือข้อร้องเรียน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเภทเรื่อง"
      },
      {
        "id": "people",
        "label": "บุคคลหรือตำแหน่งที่เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "หลีกเลี่ยงข้อมูลส่วนบุคคลเกินจำเป็น"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและข้อกล่าวหา",
        "type": "textarea",
        "required": true,
        "placeholder": "แยกข้อเท็จจริงจากความเห็น"
      },
      {
        "id": "evidence",
        "label": "พยานหลักฐานที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "เอกสาร พยานบุคคล หรือข้อมูลระบบ"
      },
      {
        "id": "procedure",
        "label": "ขั้นตอนที่ดำเนินการแล้ว",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุคำสั่ง การแจ้งสิทธิ หรือการสอบ"
      },
      {
        "id": "desired_result",
        "label": "ผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "เช่น กรอบตรวจข้อเท็จจริง ร่างหนังสือ หรือบทวิเคราะห์"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp111",
    "gp_code": "GP111",
    "name": "ตรวจขอบเขตงานเพื่อป้องกันการกำหนดคุณสมบัติเจาะจง",
    "description": "ข้อจำกัดการแข่งขันและข้อความเสนอแก้",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP111 — ตรวจขอบเขตงานเพื่อป้องกันการกำหนดคุณสมบัติเจาะจง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp112",
    "gp_code": "GP112",
    "name": "ตรวจ ขอบเขตงาน เบื้องต้น",
    "description": "ค้นหาข้อจำกัดการแข่งขันและความไม่ชัดเจน",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP112 — ตรวจ ขอบเขตงาน เบื้องต้น\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและชื่อโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและชื่อโครงการ"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และความต้องการใช้งาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุวัตถุประสงค์และความต้องการใช้งาน"
      },
      {
        "id": "budget",
        "label": "วงเงินและวิธีจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวงเงินและวิธีจัดซื้อจัดจ้าง"
      },
      {
        "id": "documents",
        "label": "TOR สัญญา หรือเอกสารที่เกี่ยวข้อง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุTOR สัญญา หรือเอกสารที่เกี่ยวข้อง"
      },
      {
        "id": "field_05",
        "label": "ประเด็นกังวลและหลักฐานที่มี",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นกังวลและหลักฐานที่มี"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp113",
    "gp_code": "GP113",
    "name": "จัดทำขอบเขตงานและข้อกำหนดการจัดซื้อจัดจ้าง",
    "description": "จัดขอบเขต ส่งมอบ ตรวจรับ และรับประกัน",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP113 — จัดทำขอบเขตงานและข้อกำหนดการจัดซื้อจัดจ้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและชื่อโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและชื่อโครงการ"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และความต้องการใช้งาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุวัตถุประสงค์และความต้องการใช้งาน"
      },
      {
        "id": "budget",
        "label": "วงเงินและวิธีจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวงเงินและวิธีจัดซื้อจัดจ้าง"
      },
      {
        "id": "documents",
        "label": "TOR สัญญา หรือเอกสารที่เกี่ยวข้อง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุTOR สัญญา หรือเอกสารที่เกี่ยวข้อง"
      },
      {
        "id": "field_05",
        "label": "ประเด็นกังวลและหลักฐานที่มี",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นกังวลและหลักฐานที่มี"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp114",
    "gp_code": "GP114",
    "name": "ตรวจราคากลางและความคุ้มค่า",
    "description": "แหล่งราคา คุณลักษณะ ปริมาณ และร่องรอยคำนวณ",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP114 — ตรวจราคากลางและความคุ้มค่า\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp115",
    "gp_code": "GP115",
    "name": "วิเคราะห์วิธีจัดซื้อจัดจ้างที่เหมาะสม",
    "description": "เปรียบเทียบวิธี ฐานกฎหมาย ข้อจำกัด และความเสี่ยง",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP115 — วิเคราะห์วิธีจัดซื้อจัดจ้างที่เหมาะสม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp116",
    "gp_code": "GP116",
    "name": "ตรวจคุณสมบัติผู้ยื่นข้อเสนอ",
    "description": "ตรวจคุณสมบัติ เหตุตัดสิทธิ์ เอกสาร และความเสี่ยง",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP116 — ตรวจคุณสมบัติผู้ยื่นข้อเสนอ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp117",
    "gp_code": "GP117",
    "name": "วิเคราะห์ผลการพิจารณาเสนอราคา",
    "description": "เปรียบเทียบราคา ความคุ้มค่า หลักเกณฑ์ และความเสี่ยง",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP117 — วิเคราะห์ผลการพิจารณาเสนอราคา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp118",
    "gp_code": "GP118",
    "name": "ร่างรายงานผลการพิจารณาจัดซื้อจัดจ้าง",
    "description": "ร่างข้อเท็จจริง ขั้นตอน ผล เหตุผล และข้อเสนออนุมัติ",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP118 — ร่างรายงานผลการพิจารณาจัดซื้อจัดจ้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp119",
    "gp_code": "GP119",
    "name": "จัดทำรายงานเสนออนุมัติจัดซื้อจัดจ้าง",
    "description": "ร่างเหตุผล ความจำเป็น กฎหมาย วิธี และข้อเสนออนุมัติ",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP119 — จัดทำรายงานเสนออนุมัติจัดซื้อจัดจ้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp120",
    "gp_code": "GP120",
    "name": "เจ้าหน้าที่พัสดุ",
    "description": "ผู้ช่วยตรวจ ขอบเขตงาน ราคา เอกสาร สัญญา ตรวจรับ และความเสี่ยง",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP120 — เจ้าหน้าที่พัสดุ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp121",
    "gp_code": "GP121",
    "name": "ตรวจความเสี่ยงแบ่งซื้อแบ่งจ้าง",
    "description": "พื้นที่ เวลา งบประมาณ และการคาดหมายล่วงหน้า",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP121 — ตรวจความเสี่ยงแบ่งซื้อแบ่งจ้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp122",
    "gp_code": "GP122",
    "name": "ตรวจสัญญาหรือบันทึกข้อตกลงด้านอำนาจและความรับผิด",
    "description": "อำนาจ หน้าที่ ทรัพย์สิน ความรับผิด และข้อพิพาท",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP122 — ตรวจสัญญาหรือบันทึกข้อตกลงด้านอำนาจและความรับผิด\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp123",
    "gp_code": "GP123",
    "name": "ตรวจร่างสัญญาพร้อมค่าปรับ หลักประกัน และการบอกเลิก",
    "description": "ตรวจค่าปรับ หลักประกัน และการบอกเลิก",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP123 — ตรวจร่างสัญญาพร้อมค่าปรับ หลักประกัน และการบอกเลิก\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและชื่อโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและชื่อโครงการ"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และความต้องการใช้งาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุวัตถุประสงค์และความต้องการใช้งาน"
      },
      {
        "id": "budget",
        "label": "วงเงินและวิธีจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวงเงินและวิธีจัดซื้อจัดจ้าง"
      },
      {
        "id": "documents",
        "label": "TOR สัญญา หรือเอกสารที่เกี่ยวข้อง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุTOR สัญญา หรือเอกสารที่เกี่ยวข้อง"
      },
      {
        "id": "field_05",
        "label": "ประเด็นกังวลและหลักฐานที่มี",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประเด็นกังวลและหลักฐานที่มี"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp124",
    "gp_code": "GP124",
    "name": "ร่างสัญญาจัดซื้อจัดจ้าง",
    "description": "สร้างร่างสัญญาพร้อมเงื่อนไขส่งมอบ ตรวจรับ และค่าปรับ",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP124 — ร่างสัญญาจัดซื้อจัดจ้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp125",
    "gp_code": "GP125",
    "name": "วิเคราะห์การขยายเวลาสัญญาจัดซื้อจัดจ้าง",
    "description": "ตรวจเหตุ เงื่อนไข ผลกระทบ และความเห็นผู้มีอำนาจ",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP125 — วิเคราะห์การขยายเวลาสัญญาจัดซื้อจัดจ้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp126",
    "gp_code": "GP126",
    "name": "วิเคราะห์การเปลี่ยนแปลงสัญญา",
    "description": "ประเมินการแก้ไขสัญญา ผลกระทบ และทางดำเนินการ",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP126 — วิเคราะห์การเปลี่ยนแปลงสัญญา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp127",
    "gp_code": "GP127",
    "name": "วิเคราะห์การบอกเลิกสัญญา",
    "description": "ตรวจเหตุ ขั้นตอน สิทธิ ความเสี่ยงฟ้องร้อง และทางดำเนินการ",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP127 — วิเคราะห์การบอกเลิกสัญญา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp128",
    "gp_code": "GP128",
    "name": "วิเคราะห์ค่าปรับตามสัญญา",
    "description": "แสดงวิธีคำนวณ จำนวนค่าปรับ ข้อยกเว้น และความเห็น",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP128 — วิเคราะห์ค่าปรับตามสัญญา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp129",
    "gp_code": "GP129",
    "name": "จัดทำรายงานปัญหาสัญญา",
    "description": "สรุปข้อเท็จจริง สาเหตุ ผลกระทบ ทางแก้ และข้อเสนอ",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP129 — จัดทำรายงานปัญหาสัญญา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp130",
    "gp_code": "GP130",
    "name": "ตรวจขอบเขตงานในมุมมองผู้ตรวจสอบเชิงเข้ม",
    "description": "ค้นหาจุดล็อกสเปก ข้อจำกัดการแข่งขัน ความคลุมเครือ และความเสี่ยงร้องเรียน",
    "group_code": "G05",
    "group_name": "งานพัสดุ จัดซื้อจัดจ้าง และบริหารสัญญา",
    "preview": "GP130 — ตรวจขอบเขตงานในมุมมองผู้ตรวจสอบเชิงเข้ม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "procurement",
        "label": "โครงการหรือรายการจัดซื้อจัดจ้าง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อรายการ"
      },
      {
        "id": "method",
        "label": "วิธีจัดซื้อจัดจ้างหรือสถานะ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุวิธีและขั้นตอนปัจจุบัน"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน คุณลักษณะ หรือปริมาณ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระสำคัญของขอบเขตงาน"
      },
      {
        "id": "budget",
        "label": "วงเงิน ราคากลาง และแหล่งงบประมาณ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวเลขจากเอกสารจริง"
      },
      {
        "id": "contract",
        "label": "สัญญา เงื่อนไข และกำหนดเวลา",
        "type": "textarea",
        "required": false,
        "placeholder": "วางข้อสัญญาที่เกี่ยวข้อง"
      },
      {
        "id": "evidence",
        "label": "เอกสารและหลักฐานประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "รายงาน ใบเสนอราคา มติ หรือหนังสือ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp131",
    "gp_code": "GP131",
    "name": "รายการตรวจสอบ ก่อนตรวจรับ",
    "description": "ขอบเขตงาน สัญญา บัญชีปริมาณงาน ผลงานจริง และรายการห้ามลงนาม",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP131 — รายการตรวจสอบ ก่อนตรวจรับ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp132",
    "gp_code": "GP132",
    "name": "ตรวจรับพัสดุและวิเคราะห์ความเสี่ยง",
    "description": "ตรวจความครบถ้วน ขอบเขตงาน สัญญา ปัญหา และทางดำเนินการ",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP132 — ตรวจรับพัสดุและวิเคราะห์ความเสี่ยง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp133",
    "gp_code": "GP133",
    "name": "ตรวจความพร้อมโครงการก่อนลงนามตรวจรับ",
    "description": "เทียบ ขอบเขตงาน สัญญา แบบรูป บัญชีปริมาณงาน ผลงานจริง และหลักฐานก่อนคณะกรรมการลงนาม",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP133 — ตรวจความพร้อมโครงการก่อนลงนามตรวจรับ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและชื่อโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและชื่อโครงการ"
      },
      {
        "id": "field_02",
        "label": "TOR/ขอบเขตงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุTOR/ขอบเขตงาน"
      },
      {
        "id": "documents",
        "label": "สัญญาและเอกสารแนบท้าย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุสัญญาและเอกสารแนบท้าย"
      },
      {
        "id": "field_04",
        "label": "แบบรูปและ BOQ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแบบรูปและ BOQ"
      },
      {
        "id": "field_05",
        "label": "กำหนดส่งมอบและการขยายเวลา",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกำหนดส่งมอบและการขยายเวลา"
      },
      {
        "id": "field_06",
        "label": "รายงานควบคุมงาน/ผลทดสอบ/ภาพถ่าย",
        "type": "text",
        "required": false,
        "placeholder": "ระบุรายงานควบคุมงาน/ผลทดสอบ/ภาพถ่าย"
      },
      {
        "id": "field_07",
        "label": "ผลงานที่ตรวจพบจริง",
        "type": "text",
        "required": false,
        "placeholder": "ระบุผลงานที่ตรวจพบจริง"
      },
      {
        "id": "field_08",
        "label": "ปัญหา ข้อบกพร่อง หรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัญหา ข้อบกพร่อง หรือข้อสงสัย"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp134",
    "gp_code": "GP134",
    "name": "วิเคราะห์การตรวจรับงานก่อสร้าง",
    "description": "ตรวจแบบ ปริมาณ ข้อบกพร่อง และความพร้อมตรวจรับ",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP134 — วิเคราะห์การตรวจรับงานก่อสร้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp135",
    "gp_code": "GP135",
    "name": "วิเคราะห์การส่งมอบงานก่อสร้าง",
    "description": "ตรวจสัญญา งวดงาน ระยะเวลา การส่งมอบ และรายงานควบคุมงาน",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP135 — วิเคราะห์การส่งมอบงานก่อสร้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp136",
    "gp_code": "GP136",
    "name": "วิเคราะห์การขยายสัญญางานก่อสร้าง",
    "description": "ตรวจเหตุแห่งการขยาย หลักฐาน ระยะเวลา และความเสี่ยง",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP136 — วิเคราะห์การขยายสัญญางานก่อสร้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp137",
    "gp_code": "GP137",
    "name": "วิเคราะห์การคิดค่าปรับ",
    "description": "คำนวณวันผิดสัญญา ค่าปรับ เหตุยกเว้น และความเสี่ยง",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP137 — วิเคราะห์การคิดค่าปรับ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp138",
    "gp_code": "GP138",
    "name": "วิเคราะห์การแก้ไขสัญญา",
    "description": "ตรวจเหตุผล รายการ วงเงิน ระยะเวลา และผลกระทบ",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP138 — วิเคราะห์การแก้ไขสัญญา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp139",
    "gp_code": "GP139",
    "name": "วิเคราะห์งานเพิ่มงานลด",
    "description": "ตรวจเหตุผล ปริมาณ ราคา ผลกระทบ และสัญญา",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP139 — วิเคราะห์งานเพิ่มงานลด\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp140",
    "gp_code": "GP140",
    "name": "ตรวจรับครุภัณฑ์ด้านจำนวน คุณภาพ และการรับประกัน",
    "description": "ตรวจ ขอบเขตงาน จำนวน คุณภาพ รับประกัน และความพร้อมใช้",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP140 — ตรวจรับครุภัณฑ์ด้านจำนวน คุณภาพ และการรับประกัน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp141",
    "gp_code": "GP141",
    "name": "ตรวจรับครุภัณฑ์เทียบข้อกำหนดและหลักฐาน",
    "description": "ตรวจ ขอบเขตงาน คุณลักษณะ จำนวน อุปกรณ์ การติดตั้ง และรับประกัน",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP141 — ตรวจรับครุภัณฑ์เทียบข้อกำหนดและหลักฐาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp142",
    "gp_code": "GP142",
    "name": "วิเคราะห์การตรวจรับงานจ้างบริการ",
    "description": "ตรวจ ขอบเขตงาน ขอบเขต ผลงาน หลักฐาน และคุณภาพ",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP142 — วิเคราะห์การตรวจรับงานจ้างบริการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp143",
    "gp_code": "GP143",
    "name": "วิเคราะห์ข้อพิพาทสัญญา",
    "description": "วิเคราะห์ข้อเท็จจริง สิทธิหน้าที่ ความเสียหาย และทางระงับข้อพิพาท",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP143 — วิเคราะห์ข้อพิพาทสัญญา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp144",
    "gp_code": "GP144",
    "name": "วิเคราะห์ความเสี่ยงโครงการก่อสร้าง",
    "description": "ประเมินงบประมาณ คุณภาพ เวลา ความปลอดภัย กฎหมาย และการตรวจสอบ",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP144 — วิเคราะห์ความเสี่ยงโครงการก่อสร้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp145",
    "gp_code": "GP145",
    "name": "ตรวจสอบโครงการก่อสร้างแบบครบวงจร",
    "description": "ตรวจโครงการก่อสร้างครบวงจรเสมือนผู้ตรวจราชการ",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP145 — ตรวจสอบโครงการก่อสร้างแบบครบวงจร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp146",
    "gp_code": "GP146",
    "name": "วิเคราะห์ข้อพิพาทกับผู้รับจ้าง",
    "description": "วิเคราะห์สิทธิ ความเสี่ยง การเจรจา และทางคดี",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP146 — วิเคราะห์ข้อพิพาทกับผู้รับจ้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp147",
    "gp_code": "GP147",
    "name": "วิเคราะห์โครงการก่อนตรวจรับ",
    "description": "ตรวจ ขอบเขตงาน สัญญา แบบรูป บัญชีปริมาณงาน ผลงานจริง และความเสี่ยง",
    "group_code": "G06",
    "group_name": "งานก่อสร้าง ควบคุมงาน และตรวจรับ",
    "preview": "GP147 — วิเคราะห์โครงการก่อนตรวจรับ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "โครงการ งาน หรือพัสดุที่จะตรวจรับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ"
      },
      {
        "id": "scope",
        "label": "ขอบเขตงาน แบบรูป บัญชีปริมาณงาน หรือคุณลักษณะ",
        "type": "textarea",
        "required": true,
        "placeholder": "วางสาระที่ใช้เทียบตรวจ"
      },
      {
        "id": "contract",
        "label": "สัญญา งวดงาน ระยะเวลา และเงื่อนไข",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากสัญญา"
      },
      {
        "id": "actual_work",
        "label": "ผลงานจริงและผลการตรวจ",
        "type": "textarea",
        "required": true,
        "placeholder": "บันทึกสิ่งที่พบจริง"
      },
      {
        "id": "evidence",
        "label": "หลักฐานควบคุมงาน ทดสอบ ภาพถ่าย และรับประกัน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุหลักฐานที่มี"
      },
      {
        "id": "defects",
        "label": "ข้อบกพร่องหรือข้อสงสัย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจุดที่ยังไม่ผ่านหรือยังไม่ชัด"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp148",
    "gp_code": "GP148",
    "name": "ตรวจความพร้อมโครงการก่อนอนุมัติ",
    "description": "อำนาจ แผน งบประมาณ ตัวชี้วัดผลสำเร็จ และความคุ้มค่า",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP148 — ตรวจความพร้อมโครงการก่อนอนุมัติ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp149",
    "gp_code": "GP149",
    "name": "วิเคราะห์โครงการก่อนอนุมัติแบบสรุป",
    "description": "ตรวจความจำเป็น อำนาจ งบประมาณ ความคุ้มค่า ผลกระทบ และตัวชี้วัด",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP149 — วิเคราะห์โครงการก่อนอนุมัติแบบสรุป\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp150",
    "gp_code": "GP150",
    "name": "สร้างโครงร่างโครงการ",
    "description": "วัตถุประสงค์ กิจกรรม ตัวชี้วัด และงบประมาณ",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP150 — สร้างโครงร่างโครงการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและชื่อโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและชื่อโครงการ"
      },
      {
        "id": "field_02",
        "label": "ปัญหาและข้อมูลพื้นฐาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุปัญหาและข้อมูลพื้นฐาน"
      },
      {
        "id": "target",
        "label": "กลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มเป้าหมาย"
      },
      {
        "id": "field_04",
        "label": "กิจกรรม ระยะเวลา และทรัพยากร",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกิจกรรม ระยะเวลา และทรัพยากร"
      },
      {
        "id": "field_05",
        "label": "ผลผลิต ผลลัพธ์ และข้อมูลติดตาม",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผลผลิต ผลลัพธ์ และข้อมูลติดตาม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp151",
    "gp_code": "GP151",
    "name": "ออกแบบตัวชี้วัดโครงการ",
    "description": "กำหนดผลผลิต ผลลัพธ์ และแหล่งข้อมูล",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP151 — ออกแบบตัวชี้วัดโครงการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและชื่อโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและชื่อโครงการ"
      },
      {
        "id": "field_02",
        "label": "ปัญหาและข้อมูลพื้นฐาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุปัญหาและข้อมูลพื้นฐาน"
      },
      {
        "id": "target",
        "label": "กลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มเป้าหมาย"
      },
      {
        "id": "field_04",
        "label": "กิจกรรม ระยะเวลา และทรัพยากร",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกิจกรรม ระยะเวลา และทรัพยากร"
      },
      {
        "id": "field_05",
        "label": "ผลผลิต ผลลัพธ์ และข้อมูลติดตาม",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผลผลิต ผลลัพธ์ และข้อมูลติดตาม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp152",
    "gp_code": "GP152",
    "name": "สร้างทะเบียนความเสี่ยงโครงการ",
    "description": "ประเมินโอกาส ผลกระทบ และมาตรการ",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP152 — สร้างทะเบียนความเสี่ยงโครงการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและชื่อโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและชื่อโครงการ"
      },
      {
        "id": "field_02",
        "label": "ปัญหาและข้อมูลพื้นฐาน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุปัญหาและข้อมูลพื้นฐาน"
      },
      {
        "id": "target",
        "label": "กลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มเป้าหมาย"
      },
      {
        "id": "field_04",
        "label": "กิจกรรม ระยะเวลา และทรัพยากร",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกิจกรรม ระยะเวลา และทรัพยากร"
      },
      {
        "id": "field_05",
        "label": "ผลผลิต ผลลัพธ์ และข้อมูลติดตาม",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผลผลิต ผลลัพธ์ และข้อมูลติดตาม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp153",
    "gp_code": "GP153",
    "name": "วิเคราะห์องค์กรและจัดทำแผนพัฒนา",
    "description": "จุดแข็ง จุดอ่อน โอกาส และอุปสรรค, ปัจจัยภายนอกหกด้าน, ช่องว่าง, ความเสี่ยง และแผน 90 วัน/1 ปี",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP153 — วิเคราะห์องค์กรและจัดทำแผนพัฒนา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp154",
    "gp_code": "GP154",
    "name": "วิเคราะห์และปรับปรุงกระบวนงาน",
    "description": "จุดคอขวด ลดงานซ้ำ การควบคุม และ กรอบเวลาการให้บริการ",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP154 — วิเคราะห์และปรับปรุงกระบวนงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp155",
    "gp_code": "GP155",
    "name": "วิเคราะห์คำของบประมาณอย่างครบถ้วน",
    "description": "ตรวจเหตุผล ความจำเป็น และความคุ้มค่า",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP155 — วิเคราะห์คำของบประมาณอย่างครบถ้วน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและโครงการ"
      },
      {
        "id": "field_02",
        "label": "ภารกิจหรืออำนาจหน้าที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุภารกิจหรืออำนาจหน้าที่"
      },
      {
        "id": "field_03",
        "label": "เหตุผลและความจำเป็น",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเหตุผลและความจำเป็น"
      },
      {
        "id": "budget",
        "label": "วงเงินและรายละเอียดค่าใช้จ่าย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวงเงินและรายละเอียดค่าใช้จ่าย"
      },
      {
        "id": "target",
        "label": "ผลผลิต ผลลัพธ์ และกลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผลผลิต ผลลัพธ์ และกลุ่มเป้าหมาย"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp156",
    "gp_code": "GP156",
    "name": "ร่างคำชี้แจงงบประมาณ",
    "description": "อธิบายผลผลิต ผลลัพธ์ และความจำเป็น",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP156 — ร่างคำชี้แจงงบประมาณ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและโครงการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและโครงการ"
      },
      {
        "id": "field_02",
        "label": "ภารกิจหรืออำนาจหน้าที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุภารกิจหรืออำนาจหน้าที่"
      },
      {
        "id": "field_03",
        "label": "เหตุผลและความจำเป็น",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเหตุผลและความจำเป็น"
      },
      {
        "id": "budget",
        "label": "วงเงินและรายละเอียดค่าใช้จ่าย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวงเงินและรายละเอียดค่าใช้จ่าย"
      },
      {
        "id": "target",
        "label": "ผลผลิต ผลลัพธ์ และกลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผลผลิต ผลลัพธ์ และกลุ่มเป้าหมาย"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp157",
    "gp_code": "GP157",
    "name": "วิเคราะห์โครงการก่อนของบประมาณ",
    "description": "ตรวจอำนาจ ความจำเป็น ความคุ้มค่า ผลกระทบ และความเสี่ยง",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP157 — วิเคราะห์โครงการก่อนของบประมาณ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp158",
    "gp_code": "GP158",
    "name": "จัดทำ วิเคราะห์จุดแข็ง จุดอ่อน โอกาส และอุปสรรค",
    "description": "วิเคราะห์จุดแข็ง จุดอ่อน โอกาส อุปสรรค และกลยุทธ์",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP158 — จัดทำ วิเคราะห์จุดแข็ง จุดอ่อน โอกาส และอุปสรรค\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp159",
    "gp_code": "GP159",
    "name": "จัดทำแผนยุทธศาสตร์",
    "description": "สร้างเป้าประสงค์ กลยุทธ์ ตัวชี้วัด โครงการ และผลลัพธ์",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP159 — จัดทำแผนยุทธศาสตร์\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp160",
    "gp_code": "GP160",
    "name": "จัดทำ ตัวชี้วัดผลสำเร็จ",
    "description": "ออกแบบตัวชี้วัด ค่าเป้าหมาย วิธีวัด แหล่งข้อมูล และความถี่",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP160 — จัดทำ ตัวชี้วัดผลสำเร็จ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp161",
    "gp_code": "GP161",
    "name": "วิเคราะห์งบประมาณประจำปี",
    "description": "ตรวจสมดุล ความคุ้มค่า จุดเสี่ยง และรายการควรปรับ",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP161 — วิเคราะห์งบประมาณประจำปี\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp162",
    "gp_code": "GP162",
    "name": "จัดลำดับโครงการตามความจำเป็นและยุทธศาสตร์",
    "description": "จัดอันดับจากความจำเป็น คุ้มค่า พร้อม ผลกระทบ และยุทธศาสตร์",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP162 — จัดลำดับโครงการตามความจำเป็นและยุทธศาสตร์\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp163",
    "gp_code": "GP163",
    "name": "จัดลำดับโครงการด้วยเกณฑ์โปร่งใส",
    "description": "จัดอันดับโครงการด้วยเกณฑ์โปร่งใสและตรวจสอบได้",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP163 — จัดลำดับโครงการด้วยเกณฑ์โปร่งใส\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp164",
    "gp_code": "GP164",
    "name": "วิเคราะห์ความคุ้มค่าโครงการด้านต้นทุนและผลกระทบ",
    "description": "ประเมินต้นทุน ประโยชน์ ผลกระทบ และความคุ้มค่าโดยรวม",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP164 — วิเคราะห์ความคุ้มค่าโครงการด้านต้นทุนและผลกระทบ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp165",
    "gp_code": "GP165",
    "name": "วิเคราะห์ความคุ้มค่าโครงการด้านเศรษฐกิจ สังคม และความเสี่ยง",
    "description": "ประเมิน ต้นทุนและประโยชน์ คุณค่าทางเศรษฐกิจและสังคม",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP165 — วิเคราะห์ความคุ้มค่าโครงการด้านเศรษฐกิจ สังคม และความเสี่ยง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp166",
    "gp_code": "GP166",
    "name": "ประเมินความเสี่ยงองค์กรแบบพื้นฐาน",
    "description": "จัดระดับโอกาส ผลกระทบ และมาตรการควบคุม",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP166 — ประเมินความเสี่ยงองค์กรแบบพื้นฐาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp167",
    "gp_code": "GP167",
    "name": "จัดทำทะเบียนความเสี่ยงระดับองค์กร",
    "description": "จัดทำทะเบียนความเสี่ยง พร้อมผู้รับผิดชอบและมาตรการควบคุม",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP167 — จัดทำทะเบียนความเสี่ยงระดับองค์กร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp168",
    "gp_code": "GP168",
    "name": "ที่ปรึกษาผู้บริหารด้านยุทธศาสตร์",
    "description": "วิเคราะห์นโยบาย ผลกระทบ ความเสี่ยง และทางเลือก",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP168 — ที่ปรึกษาผู้บริหารด้านยุทธศาสตร์\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp169",
    "gp_code": "GP169",
    "name": "วิเคราะห์แผนยุทธศาสตร์องค์กร",
    "description": "ตรวจอำนาจ ความเชื่อมโยง จุดแข็ง ช่องว่าง และข้อเสนอ",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP169 — วิเคราะห์แผนยุทธศาสตร์องค์กร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp170",
    "gp_code": "GP170",
    "name": "จัดทำแผนปฏิบัติการประจำปี",
    "description": "กำหนดเป้าหมาย กิจกรรม เวลา ตัวชี้วัดผลสำเร็จ ผลผลิต และผลลัพธ์",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP170 — จัดทำแผนปฏิบัติการประจำปี\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp171",
    "gp_code": "GP171",
    "name": "ประเมินคำของบประมาณแบบสรุป 5 มิติ",
    "description": "ประเมินความจำเป็น คุ้มค่า ผลกระทบ ความเสี่ยง และวงเงิน",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP171 — ประเมินคำของบประมาณแบบสรุป 5 มิติ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp172",
    "gp_code": "GP172",
    "name": "วิเคราะห์ ตัวชี้วัดผลสำเร็จ",
    "description": "ตรวจความเหมาะสม การวัด สาเหตุไม่บรรลุ และทางปรับปรุง",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP172 — วิเคราะห์ ตัวชี้วัดผลสำเร็จ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp173",
    "gp_code": "GP173",
    "name": "จัดทำแผนบริหารความต่อเนื่องขององค์กร",
    "description": "วางแผนรองรับ ขั้นตอน ผู้รับผิดชอบ การสื่อสาร และการฟื้นฟู",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP173 — จัดทำแผนบริหารความต่อเนื่องขององค์กร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp174",
    "gp_code": "GP174",
    "name": "วิเคราะห์และจัดการเหตุวิกฤต",
    "description": "ประเมินสถานการณ์และสร้างแผนตอบสนองกับแผนสื่อสาร",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP174 — วิเคราะห์และจัดการเหตุวิกฤต\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp175",
    "gp_code": "GP175",
    "name": "จัดทำแผนพัฒนาองค์กร",
    "description": "กำหนดวิสัยทัศน์ กลยุทธ์ แผนปฏิบัติ ตัวชี้วัดผลสำเร็จ และ แผนดำเนินงาน",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP175 — จัดทำแผนพัฒนาองค์กร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp176",
    "gp_code": "GP176",
    "name": "วิเคราะห์ความเสี่ยงรอบด้าน 360 องศา",
    "description": "ประเมินกฎหมาย งบ พัสดุ บุคคล เทคโนโลยีสารสนเทศ กฎหมายคุ้มครองข้อมูลส่วนบุคคล ธรรมาภิบาล และภาพลักษณ์",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP176 — วิเคราะห์ความเสี่ยงรอบด้าน 360 องศา\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp177",
    "gp_code": "GP177",
    "name": "วิเคราะห์นโยบายสาธารณะ",
    "description": "ประเมินความเป็นไปได้ ผลกระทบ ความคุ้มค่า และเสนอสามทางเลือก",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP177 — วิเคราะห์นโยบายสาธารณะ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp178",
    "gp_code": "GP178",
    "name": "ออกแบบหน้าสรุปข้อมูลผู้บริหารพร้อมแหล่งข้อมูล",
    "description": "สรุปตัวชี้วัด งบประมาณ ความคืบหน้า ความเสี่ยง และเรื่องเร่งด่วน",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP178 — ออกแบบหน้าสรุปข้อมูลผู้บริหารพร้อมแหล่งข้อมูล\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp179",
    "gp_code": "GP179",
    "name": "ออกแบบหน้าสรุปสถานะโครงการสำหรับผู้บริหาร",
    "description": "ออกแบบภาพรวมโครงการ งบ ตัวชี้วัดผลสำเร็จ ความเสี่ยง และเรื่องเร่งด่วน",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP179 — ออกแบบหน้าสรุปสถานะโครงการสำหรับผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp180",
    "gp_code": "GP180",
    "name": "เตรียมข้อมูลสำหรับประชุมผู้บริหาร",
    "description": "สรุปประเด็นตัดสินใจ ทางเลือก ข้อดีข้อเสีย และข้อเสนอ",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP180 — เตรียมข้อมูลสำหรับประชุมผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp181",
    "gp_code": "GP181",
    "name": "ผู้ช่วยผู้บริหารองค์กรปกครองส่วนท้องถิ่น",
    "description": "ช่วยวิเคราะห์นโยบาย โครงการ งบประมาณ ความเสี่ยง และทางเลือกประกอบการตัดสินใจ",
    "group_code": "G07",
    "group_name": "งานแผน ยุทธศาสตร์ โครงการ งบประมาณ และความเสี่ยง",
    "preview": "GP181 — ผู้ช่วยผู้บริหารองค์กรปกครองส่วนท้องถิ่น\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "plan_project",
        "label": "แผน โครงการ หรืองบประมาณ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อเรื่อง"
      },
      {
        "id": "problem",
        "label": "ปัญหาและความจำเป็น",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายสภาพปัญหาจากข้อมูลจริง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์และกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเป้าหมายที่วัดได้"
      },
      {
        "id": "activities",
        "label": "กิจกรรม ระยะเวลา และผู้รับผิดชอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุแผนดำเนินงาน"
      },
      {
        "id": "budget",
        "label": "กรอบงบประมาณและทรัพยากร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวงเงินและที่มา"
      },
      {
        "id": "indicators",
        "label": "ผลผลิต ผลลัพธ์ และตัวชี้วัด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุตัวชี้วัดที่มีข้อมูล"
      },
      {
        "id": "risks",
        "label": "ข้อจำกัดและความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุปัจจัยเสี่ยง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp182",
    "gp_code": "GP182",
    "name": "ผู้ช่วยจัดทำคำกล่าวราชการระดับองค์กร",
    "description": "คำกล่าวราชการ ยึดข้อเท็จจริงเป็นหลัก ครอบคลุมพิธีภาครัฐหลายระดับ พร้อม บัตรช่วยพูด และ คะแนนคุณภาพ",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP182 — ผู้ช่วยจัดทำคำกล่าวราชการระดับองค์กร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "project",
        "label": "ชื่อโครงการหรือกิจกรรม",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการหรือกิจกรรม"
      },
      {
        "id": "agency",
        "label": "หน่วยงานผู้จัด",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานผู้จัด"
      },
      {
        "id": "datetime",
        "label": "วัน เวลา และสถานที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวัน เวลา และสถานที่"
      },
      {
        "id": "speaker",
        "label": "ผู้กล่าวและตำแหน่ง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้กล่าวและตำแหน่ง"
      },
      {
        "id": "chair",
        "label": "ประธานในพิธีและตำแหน่ง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุประธานในพิธีและตำแหน่ง"
      },
      {
        "id": "participants",
        "label": "ผู้เข้าร่วมและกลุ่มเป้าหมาย",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผู้เข้าร่วมและกลุ่มเป้าหมาย"
      },
      {
        "id": "participants_7",
        "label": "จำนวนผู้เข้าร่วม",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุจำนวนผู้เข้าร่วม"
      },
      {
        "id": "field_08",
        "label": "ความเป็นมาและความจำเป็น",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเป็นมาและความจำเป็น"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุวัตถุประสงค์"
      },
      {
        "id": "format",
        "label": "รูปแบบและสาระสำคัญของกิจกรรม",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุรูปแบบและสาระสำคัญของกิจกรรม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp183",
    "gp_code": "GP183",
    "name": "ร่างคำกล่าวรายงานพิธีเปิด",
    "description": "ใช้ในพิธีเปิดโครงการ อบรม ประชุม หรือกิจกรรมของ อปท.",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP183 — ร่างคำกล่าวรายงานพิธีเปิด\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "content_type",
        "label": "ประเภทสื่อหรือคำกล่าว",
        "type": "text",
        "required": true,
        "placeholder": "เช่น ข่าว คำกล่าวเปิด โปสเตอร์ อินโฟกราฟิก"
      },
      {
        "id": "agency",
        "label": "หน่วยงานหรือผู้จัด",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "event",
        "label": "ชื่อกิจกรรมหรือเรื่องที่จะสื่อสาร",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริง วัน เวลา สถานที่ และผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": true,
        "placeholder": "ใช้เฉพาะข้อมูลยืนยันแล้ว"
      },
      {
        "id": "audience",
        "label": "กลุ่มเป้าหมายและช่องทาง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผู้ฟังหรือช่องทางเผยแพร่"
      },
      {
        "id": "message",
        "label": "สารสำคัญและประโยชน์ต่อประชาชน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องการสื่อ"
      },
      {
        "id": "source_material",
        "label": "ต้นฉบับหรือเอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "วางเนื้อหาที่ต้องรักษา"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp184",
    "gp_code": "GP184",
    "name": "ร่างคำกล่าวเปิดงานสำหรับผู้บริหาร",
    "description": "สำหรับผู้บริหารท้องถิ่นหรือหัวหน้าส่วนราชการกล่าวเปิดงาน",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP184 — ร่างคำกล่าวเปิดงานสำหรับผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "content_type",
        "label": "ประเภทสื่อหรือคำกล่าว",
        "type": "text",
        "required": true,
        "placeholder": "เช่น ข่าว คำกล่าวเปิด โปสเตอร์ อินโฟกราฟิก"
      },
      {
        "id": "agency",
        "label": "หน่วยงานหรือผู้จัด",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "event",
        "label": "ชื่อกิจกรรมหรือเรื่องที่จะสื่อสาร",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริง วัน เวลา สถานที่ และผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": true,
        "placeholder": "ใช้เฉพาะข้อมูลยืนยันแล้ว"
      },
      {
        "id": "audience",
        "label": "กลุ่มเป้าหมายและช่องทาง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผู้ฟังหรือช่องทางเผยแพร่"
      },
      {
        "id": "message",
        "label": "สารสำคัญและประโยชน์ต่อประชาชน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องการสื่อ"
      },
      {
        "id": "source_material",
        "label": "ต้นฉบับหรือเอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "วางเนื้อหาที่ต้องรักษา"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp185",
    "gp_code": "GP185",
    "name": "ร่างคำกล่าวเปิดงาน",
    "description": "สร้างคำกล่าวตามบริบทและกลุ่มผู้ฟัง",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP185 — ร่างคำกล่าวเปิดงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "field_02",
        "label": "กิจกรรมหรือสารหลัก",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกิจกรรมหรือสารหลัก"
      },
      {
        "id": "target",
        "label": "กลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มเป้าหมาย"
      },
      {
        "id": "datetime",
        "label": "ข้อเท็จจริง วัน เวลา สถานที่",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริง วัน เวลา สถานที่"
      },
      {
        "id": "field_05",
        "label": "ช่องทางเผยแพร่และช่องทางติดต่อ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุช่องทางเผยแพร่และช่องทางติดต่อ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp186",
    "gp_code": "GP186",
    "name": "เขียนข่าวและข้อความประชาสัมพันธ์หลายช่องทาง",
    "description": "หัวข้อ โปรยข่าว เนื้อข่าว และ เฟซบุ๊ก",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP186 — เขียนข่าวและข้อความประชาสัมพันธ์หลายช่องทาง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "content_type",
        "label": "ประเภทสื่อหรือคำกล่าว",
        "type": "text",
        "required": true,
        "placeholder": "เช่น ข่าว คำกล่าวเปิด โปสเตอร์ อินโฟกราฟิก"
      },
      {
        "id": "agency",
        "label": "หน่วยงานหรือผู้จัด",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "event",
        "label": "ชื่อกิจกรรมหรือเรื่องที่จะสื่อสาร",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริง วัน เวลา สถานที่ และผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": true,
        "placeholder": "ใช้เฉพาะข้อมูลยืนยันแล้ว"
      },
      {
        "id": "audience",
        "label": "กลุ่มเป้าหมายและช่องทาง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผู้ฟังหรือช่องทางเผยแพร่"
      },
      {
        "id": "message",
        "label": "สารสำคัญและประโยชน์ต่อประชาชน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องการสื่อ"
      },
      {
        "id": "source_material",
        "label": "ต้นฉบับหรือเอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "วางเนื้อหาที่ต้องรักษา"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp187",
    "gp_code": "GP187",
    "name": "เขียนข่าวประชาสัมพันธ์ฉบับ 300 คำ",
    "description": "สร้างพาดหัว เนื้อข่าว คำกล่าวผู้บริหาร และ คำค้นกำกับ ด้วยภาษาราชการที่อ่านง่าย",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP187 — เขียนข่าวประชาสัมพันธ์ฉบับ 300 คำ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "project",
        "label": "ชื่อโครงการ/กิจกรรม",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อโครงการ/กิจกรรม"
      },
      {
        "id": "datetime",
        "label": "วัน เวลา และสถานที่",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวัน เวลา และสถานที่"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุวัตถุประสงค์"
      },
      {
        "id": "participants",
        "label": "ผู้เข้าร่วม",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผู้เข้าร่วม"
      },
      {
        "id": "field_06",
        "label": "ผลการดำเนินงาน",
        "type": "text",
        "required": false,
        "placeholder": "ระบุผลการดำเนินงาน"
      },
      {
        "id": "field_07",
        "label": "ประโยชน์ต่อประชาชน",
        "type": "text",
        "required": false,
        "placeholder": "ระบุประโยชน์ต่อประชาชน"
      },
      {
        "id": "field_08",
        "label": "ชื่อและตำแหน่งผู้บริหาร",
        "type": "text",
        "required": false,
        "placeholder": "ระบุชื่อและตำแหน่งผู้บริหาร"
      },
      {
        "id": "field_09",
        "label": "ประเด็นที่ผู้บริหารต้องการสื่อสาร",
        "type": "text",
        "required": false,
        "placeholder": "ระบุประเด็นที่ผู้บริหารต้องการสื่อสาร"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp188",
    "gp_code": "GP188",
    "name": "เขียนข่าวประชาสัมพันธ์โครงการฉบับครบถ้วน",
    "description": "เปลี่ยนข้อมูลราชการเป็นข่าวที่เข้าใจง่าย",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP188 — เขียนข่าวประชาสัมพันธ์โครงการฉบับครบถ้วน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "field_02",
        "label": "กิจกรรมหรือสารหลัก",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกิจกรรมหรือสารหลัก"
      },
      {
        "id": "target",
        "label": "กลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มเป้าหมาย"
      },
      {
        "id": "datetime",
        "label": "ข้อเท็จจริง วัน เวลา สถานที่",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริง วัน เวลา สถานที่"
      },
      {
        "id": "field_05",
        "label": "ช่องทางเผยแพร่และช่องทางติดต่อ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุช่องทางเผยแพร่และช่องทางติดต่อ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp189",
    "gp_code": "GP189",
    "name": "ข้อความประชาสัมพันธ์หลายช่องทาง",
    "description": "ปรับสารสำหรับ เฟซบุ๊ก LINE และเว็บไซต์",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP189 — ข้อความประชาสัมพันธ์หลายช่องทาง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "field_02",
        "label": "กิจกรรมหรือสารหลัก",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกิจกรรมหรือสารหลัก"
      },
      {
        "id": "target",
        "label": "กลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มเป้าหมาย"
      },
      {
        "id": "datetime",
        "label": "ข้อเท็จจริง วัน เวลา สถานที่",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริง วัน เวลา สถานที่"
      },
      {
        "id": "field_05",
        "label": "ช่องทางเผยแพร่และช่องทางติดต่อ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุช่องทางเผยแพร่และช่องทางติดต่อ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp190",
    "gp_code": "GP190",
    "name": "เอกสารสรุปหน้าเดียว งานท้องถิ่น",
    "description": "พาดหัว สรุป ขั้นตอน ติดต่อ และข้อความผู้ออกแบบ",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP190 — เอกสารสรุปหน้าเดียว งานท้องถิ่น\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "content_type",
        "label": "ประเภทสื่อหรือคำกล่าว",
        "type": "text",
        "required": true,
        "placeholder": "เช่น ข่าว คำกล่าวเปิด โปสเตอร์ อินโฟกราฟิก"
      },
      {
        "id": "agency",
        "label": "หน่วยงานหรือผู้จัด",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "event",
        "label": "ชื่อกิจกรรมหรือเรื่องที่จะสื่อสาร",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริง วัน เวลา สถานที่ และผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": true,
        "placeholder": "ใช้เฉพาะข้อมูลยืนยันแล้ว"
      },
      {
        "id": "audience",
        "label": "กลุ่มเป้าหมายและช่องทาง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผู้ฟังหรือช่องทางเผยแพร่"
      },
      {
        "id": "message",
        "label": "สารสำคัญและประโยชน์ต่อประชาชน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องการสื่อ"
      },
      {
        "id": "source_material",
        "label": "ต้นฉบับหรือเอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "วางเนื้อหาที่ต้องรักษา"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp191",
    "gp_code": "GP191",
    "name": "สร้างเอกสารสรุปหน้าเดียวและอินโฟกราฟิกที่แก้ไขได้",
    "description": "จัดทำเนื้อหา โครงเลย์เอาต์ และต้นฉบับแก้ไขต่อได้สำหรับงาน อปท.",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP191 — สร้างเอกสารสรุปหน้าเดียวและอินโฟกราฟิกที่แก้ไขได้\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "หัวเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวเรื่อง"
      },
      {
        "id": "objective",
        "label": "วัตถุประสงค์",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุวัตถุประสงค์"
      },
      {
        "id": "target",
        "label": "กลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มเป้าหมาย"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริง/ข้อมูลต้นฉบับ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริง/ข้อมูลต้นฉบับ"
      },
      {
        "id": "field_06",
        "label": "ตัวเลขหรือสถิติ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุตัวเลขหรือสถิติ"
      },
      {
        "id": "field_07",
        "label": "ข้อความสำคัญที่ต้องคงไว้",
        "type": "text",
        "required": false,
        "placeholder": "ระบุข้อความสำคัญที่ต้องคงไว้"
      },
      {
        "id": "agency_8",
        "label": "สีประจำหน่วยงาน",
        "type": "text",
        "required": false,
        "placeholder": "ระบุสีประจำหน่วยงาน"
      },
      {
        "id": "field_09",
        "label": "โลโก้และภาพประกอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุโลโก้และภาพประกอบ"
      },
      {
        "id": "field_10",
        "label": "ช่องทางติดต่อ/Call to Action",
        "type": "text",
        "required": false,
        "placeholder": "ระบุช่องทางติดต่อ/Call to Action"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp192",
    "gp_code": "GP192",
    "name": "ออกแบบโปสเตอร์สมรรถนะผู้นำ อปท.",
    "description": "โปสเตอร์ A4 แนวตั้งเรื่อง ภาวะผู้นำ พร้อมภาพผู้บริหาร บุคลากร เช็กลิสต์ และโลโก้หน่วยงาน",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP192 — ออกแบบโปสเตอร์สมรรถนะผู้นำ อปท.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "content_type",
        "label": "ประเภทสื่อหรือคำกล่าว",
        "type": "text",
        "required": true,
        "placeholder": "เช่น ข่าว คำกล่าวเปิด โปสเตอร์ อินโฟกราฟิก"
      },
      {
        "id": "agency",
        "label": "หน่วยงานหรือผู้จัด",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "event",
        "label": "ชื่อกิจกรรมหรือเรื่องที่จะสื่อสาร",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวข้อ"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริง วัน เวลา สถานที่ และผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": true,
        "placeholder": "ใช้เฉพาะข้อมูลยืนยันแล้ว"
      },
      {
        "id": "audience",
        "label": "กลุ่มเป้าหมายและช่องทาง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุผู้ฟังหรือช่องทางเผยแพร่"
      },
      {
        "id": "message",
        "label": "สารสำคัญและประโยชน์ต่อประชาชน",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุประเด็นที่ต้องการสื่อ"
      },
      {
        "id": "source_material",
        "label": "ต้นฉบับหรือเอกสารประกอบ",
        "type": "textarea",
        "required": false,
        "placeholder": "วางเนื้อหาที่ต้องรักษา"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp193",
    "gp_code": "GP193",
    "name": "ออกแบบโปสเตอร์ประชาสัมพันธ์งาน อปท.",
    "description": "แม่แบบคำสั่งหลัก สำหรับโปสเตอร์ A4 ที่เปลี่ยนหัวเรื่อง เนื้อหา ภาพ และโลโก้ได้",
    "group_code": "G08",
    "group_name": "งานประชาสัมพันธ์ พิธีการ และสื่อราชการ",
    "preview": "GP193 — ออกแบบโปสเตอร์ประชาสัมพันธ์งาน อปท.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "subject",
        "label": "หัวเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหัวเรื่อง"
      },
      {
        "id": "field_03",
        "label": "หมวดงาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหมวดงาน"
      },
      {
        "id": "target",
        "label": "กลุ่มเป้าหมาย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มเป้าหมาย"
      },
      {
        "id": "field_05",
        "label": "สาระสำคัญและลำดับข้อความ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุสาระสำคัญและลำดับข้อความ"
      },
      {
        "id": "field_06",
        "label": "รายการที่ต้องแสดงเป็นการ์ด/เช็กลิสต์",
        "type": "text",
        "required": false,
        "placeholder": "ระบุรายการที่ต้องแสดงเป็นการ์ด/เช็กลิสต์"
      },
      {
        "id": "format",
        "label": "รูปแบบภาพประกอบหรือตัวละคร",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุรูปแบบภาพประกอบหรือตัวละคร"
      },
      {
        "id": "field_08",
        "label": "โทนสีและสไตล์",
        "type": "text",
        "required": false,
        "placeholder": "ระบุโทนสีและสไตล์"
      },
      {
        "id": "field_09",
        "label": "ขนาดสื่อ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุขนาดสื่อ"
      },
      {
        "id": "field_10",
        "label": "ช่องทางติดต่อ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุช่องทางติดต่อ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp194",
    "gp_code": "GP194",
    "name": "ร่างคู่มือบริการประชาชน",
    "description": "ขั้นตอน เอกสาร ค่าธรรมเนียม ระยะเวลา และ เอกสารสรุปหน้าเดียว",
    "group_code": "G09",
    "group_name": "งานบริการประชาชน ประชาคม และคู่มือบริการ",
    "preview": "GP194 — ร่างคู่มือบริการประชาชน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "service",
        "label": "บริการหรือประเด็นประชาชน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อบริการหรือเรื่องประชาคม"
      },
      {
        "id": "agency",
        "label": "หน่วยงานรับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "target",
        "label": "กลุ่มประชาชนเป้าหมาย",
        "type": "text",
        "required": false,
        "placeholder": "ระบุกลุ่มผู้รับบริการ"
      },
      {
        "id": "facts",
        "label": "ขั้นตอน เงื่อนไข และข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากคู่มือหรือข้อเท็จจริง"
      },
      {
        "id": "documents",
        "label": "เอกสารที่ประชาชนต้องใช้",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุรายการเอกสาร"
      },
      {
        "id": "questions",
        "label": "คำถาม ปัญหา หรือความต้องการของประชาชน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตอบหรือรับฟัง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp195",
    "gp_code": "GP195",
    "name": "ตอบคำถามประชาชน คำถามและคำตอบ",
    "description": "คำตอบภาษาง่าย เงื่อนไข และช่องทางตรวจสอบ",
    "group_code": "G09",
    "group_name": "งานบริการประชาชน ประชาคม และคู่มือบริการ",
    "preview": "GP195 — ตอบคำถามประชาชน คำถามและคำตอบ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "service",
        "label": "บริการหรือประเด็นประชาชน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อบริการหรือเรื่องประชาคม"
      },
      {
        "id": "agency",
        "label": "หน่วยงานรับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "target",
        "label": "กลุ่มประชาชนเป้าหมาย",
        "type": "text",
        "required": false,
        "placeholder": "ระบุกลุ่มผู้รับบริการ"
      },
      {
        "id": "facts",
        "label": "ขั้นตอน เงื่อนไข และข้อเท็จจริง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อมูลจากคู่มือหรือข้อเท็จจริง"
      },
      {
        "id": "documents",
        "label": "เอกสารที่ประชาชนต้องใช้",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุรายการเอกสาร"
      },
      {
        "id": "questions",
        "label": "คำถาม ปัญหา หรือความต้องการของประชาชน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตอบหรือรับฟัง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp196",
    "gp_code": "GP196",
    "name": "ตอบข้อร้องเรียนประชาชน",
    "description": "ร่างคำตอบและขั้นตอนดำเนินการต่อ",
    "group_code": "G09",
    "group_name": "งานบริการประชาชน ประชาคม และคู่มือบริการ",
    "preview": "GP196 — ตอบข้อร้องเรียนประชาชน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและช่องทางรับเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและช่องทางรับเรื่อง"
      },
      {
        "id": "field_02",
        "label": "ผู้ร้องหรือกลุ่มผู้รับบริการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้ร้องหรือกลุ่มผู้รับบริการ"
      },
      {
        "id": "subject",
        "label": "เรื่องร้องเรียนหรือความต้องการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องร้องเรียนหรือความต้องการ"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและการดำเนินการที่ผ่านมา",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงและการดำเนินการที่ผ่านมา"
      },
      {
        "id": "documents",
        "label": "เอกสารและช่องทางติดต่อกลับ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเอกสารและช่องทางติดต่อกลับ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp197",
    "gp_code": "GP197",
    "name": "ออกแบบคำถามประชาคม",
    "description": "สร้างคำถามเป็นกลางและจัดกลุ่มข้อเสนอ",
    "group_code": "G09",
    "group_name": "งานบริการประชาชน ประชาคม และคู่มือบริการ",
    "preview": "GP197 — ออกแบบคำถามประชาคม\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและประเด็นรับฟัง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและประเด็นรับฟัง"
      },
      {
        "id": "field_02",
        "label": "กลุ่มผู้มีส่วนได้เสีย",
        "type": "text",
        "required": true,
        "placeholder": "ระบุกลุ่มผู้มีส่วนได้เสีย"
      },
      {
        "id": "field_03",
        "label": "ข้อมูลพื้นฐาน",
        "type": "text",
        "required": true,
        "placeholder": "ระบุข้อมูลพื้นฐาน"
      },
      {
        "id": "field_04",
        "label": "ขอบเขตการตัดสินใจ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุขอบเขตการตัดสินใจ"
      },
      {
        "id": "field_05",
        "label": "วิธีและช่วงเวลารับฟัง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุวิธีและช่วงเวลารับฟัง"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp198",
    "gp_code": "GP198",
    "name": "สรุปเรื่องร้องเรียนเสนอผู้บริหาร",
    "description": "จัดลำดับเหตุการณ์และทางเลือก",
    "group_code": "G09",
    "group_name": "งานบริการประชาชน ประชาคม และคู่มือบริการ",
    "preview": "GP198 — สรุปเรื่องร้องเรียนเสนอผู้บริหาร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "agency",
        "label": "หน่วยงานและช่องทางรับเรื่อง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุหน่วยงานและช่องทางรับเรื่อง"
      },
      {
        "id": "field_02",
        "label": "ผู้ร้องหรือกลุ่มผู้รับบริการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุผู้ร้องหรือกลุ่มผู้รับบริการ"
      },
      {
        "id": "subject",
        "label": "เรื่องร้องเรียนหรือความต้องการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเรื่องร้องเรียนหรือความต้องการ"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและการดำเนินการที่ผ่านมา",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุข้อเท็จจริงและการดำเนินการที่ผ่านมา"
      },
      {
        "id": "documents",
        "label": "เอกสารและช่องทางติดต่อกลับ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุเอกสารและช่องทางติดต่อกลับ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp199",
    "gp_code": "GP199",
    "name": "ตรวจความเสี่ยงด้านข้อมูลส่วนบุคคลในเอกสารและกระบวนงาน",
    "description": "ข้อมูล วัตถุประสงค์ การเข้าถึง และสิทธิ",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP199 — ตรวจความเสี่ยงด้านข้อมูลส่วนบุคคลในเอกสารและกระบวนงาน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp200",
    "gp_code": "GP200",
    "name": "ตรวจการปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล",
    "description": "ตรวจฐานกฎหมาย ความจำเป็น ความเสี่ยง และมาตรการคุ้มครอง",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP200 — ตรวจการปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp201",
    "gp_code": "GP201",
    "name": "แปลงข้อมูลเป็นตารางสรุป",
    "description": "จัดข้อมูลเป็นหัวข้อ ตาราง และข้อค้นพบ",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP201 — แปลงข้อมูลเป็นตารางสรุป\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "field_01",
        "label": "ชุดข้อมูลต้นทาง",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชุดข้อมูลต้นทาง"
      },
      {
        "id": "field_02",
        "label": "ความหมายของแต่ละรายการ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุความหมายของแต่ละรายการ"
      },
      {
        "id": "field_03",
        "label": "ช่วงเวลาและหน่วยนับ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุช่วงเวลาและหน่วยนับ"
      },
      {
        "id": "field_04",
        "label": "คำถามที่ต้องการคำตอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุคำถามที่ต้องการคำตอบ"
      },
      {
        "id": "format",
        "label": "รูปแบบผลลัพธ์ที่ต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุรูปแบบผลลัพธ์ที่ต้องการ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp202",
    "gp_code": "GP202",
    "name": "จัดทำนโยบายการใช้ปัญญาประดิษฐ์ขององค์กร",
    "description": "กำหนดหลักการ ขอบเขต จริยธรรม การกำกับ และประเมินผล",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP202 — จัดทำนโยบายการใช้ปัญญาประดิษฐ์ขององค์กร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp203",
    "gp_code": "GP203",
    "name": "ประเมินความพร้อมในการปรับองค์กรสู่ดิจิทัล",
    "description": "ประเมินองค์กร ระบบ บุคลากร เทคโนโลยี งบ และ แผนดำเนินงาน",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP203 — ประเมินความพร้อมในการปรับองค์กรสู่ดิจิทัล\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp204",
    "gp_code": "GP204",
    "name": "จัดทำแผนพัฒนาการใช้ปัญญาประดิษฐ์",
    "description": "วางแผน ปัญญาประดิษฐ์ 3–5 ปี พร้อมเทคโนโลยี งบ และ ตัวชี้วัดผลสำเร็จ",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP204 — จัดทำแผนพัฒนาการใช้ปัญญาประดิษฐ์\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp205",
    "gp_code": "GP205",
    "name": "วิเคราะห์ข้อมูลเพื่อสนับสนุนการตัดสินใจ",
    "description": "สกัด ข้อค้นพบสำคัญ แนวโน้ม ความเสี่ยง และข้อเสนอเชิงนโยบาย",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP205 — วิเคราะห์ข้อมูลเพื่อสนับสนุนการตัดสินใจ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp206",
    "gp_code": "GP206",
    "name": "จัดทำระบบธรรมาภิบาลข้อมูล",
    "description": "กำหนดการเก็บ เข้าถึง รักษาความปลอดภัย สำรอง และทำลายข้อมูล",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP206 — จัดทำระบบธรรมาภิบาลข้อมูล\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp207",
    "gp_code": "GP207",
    "name": "ออกแบบระบบผู้ช่วยปัญญาประดิษฐ์",
    "description": "ออกแบบขอบเขต ความสามารถ ขั้นตอนการทำงาน สิทธิ และความปลอดภัย",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP207 — ออกแบบระบบผู้ช่วยปัญญาประดิษฐ์\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp208",
    "gp_code": "GP208",
    "name": "วิเคราะห์ความมั่นคงปลอดภัยไซเบอร์",
    "description": "ประเมินความเสี่ยง ช่องโหว่ ผลกระทบ การป้องกัน และรับมือเหตุ",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP208 — วิเคราะห์ความมั่นคงปลอดภัยไซเบอร์\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp209",
    "gp_code": "GP209",
    "name": "จัดทำแผนพัฒนาระบบสารสนเทศ",
    "description": "กำหนดเป้าหมาย โครงการ เวลา งบ และตัวชี้วัด",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP209 — จัดทำแผนพัฒนาระบบสารสนเทศ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp210",
    "gp_code": "GP210",
    "name": "ให้คำปรึกษาด้านรัฐบาลดิจิทัล",
    "description": "ที่ปรึกษาด้าน ปัญญาประดิษฐ์ ข้อมูล ความมั่นคงปลอดภัยไซเบอร์ กฎหมายคุ้มครองข้อมูลส่วนบุคคล และบริการดิจิทัล",
    "group_code": "G10",
    "group_name": "งานข้อมูล รัฐบาลดิจิทัล ปัญญาประดิษฐ์ และคุ้มครองข้อมูล",
    "preview": "GP210 — ให้คำปรึกษาด้านรัฐบาลดิจิทัล\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "system",
        "label": "ระบบ ข้อมูล หรือนโยบายดิจิทัล",
        "type": "text",
        "required": true,
        "placeholder": "ระบุชื่อระบบหรือเรื่อง"
      },
      {
        "id": "organization",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุเจ้าของระบบหรือข้อมูล"
      },
      {
        "id": "current_state",
        "label": "สภาพปัจจุบันและปัญหา",
        "type": "textarea",
        "required": true,
        "placeholder": "อธิบายระบบ กระบวนงาน และข้อจำกัด"
      },
      {
        "id": "data",
        "label": "ประเภทข้อมูลและผู้เกี่ยวข้อง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุข้อมูล ผู้ใช้ และเจ้าของข้อมูล"
      },
      {
        "id": "requirements",
        "label": "เป้าหมายและความต้องการ",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุผลลัพธ์ที่ต้องการ"
      },
      {
        "id": "controls",
        "label": "มาตรการ กฎหมาย และข้อกำหนดที่มี",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุมาตรการหรือเอกสารอ้างอิง"
      },
      {
        "id": "risks",
        "label": "ความเสี่ยงด้านข้อมูล ความมั่นคง และการใช้งาน",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุความเสี่ยงที่ทราบ"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp211",
    "gp_code": "GP211",
    "name": "เตรียมเอกสารรับการตรวจจาก สตง. และ ป.ป.ช.",
    "description": "ลำดับเวลา ประเด็น หลักฐาน และช่องว่างเอกสาร",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP211 — เตรียมเอกสารรับการตรวจจาก สตง. และ ป.ป.ช.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp212",
    "gp_code": "GP212",
    "name": "วิเคราะห์เรื่องในมุมมองของ สตง.",
    "description": "จำลองการตรวจด้านระเบียบ ความคุ้มค่า ความจำเป็น และหลักฐาน",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP212 — วิเคราะห์เรื่องในมุมมองของ สตง.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp213",
    "gp_code": "GP213",
    "name": "วิเคราะห์เรื่องในมุมมองของ ป.ป.ช.",
    "description": "ประเมินผลประโยชน์ทับซ้อน ดุลยพินิจ ความโปร่งใส และความเสี่ยงทุจริต",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP213 — วิเคราะห์เรื่องในมุมมองของ ป.ป.ช.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp214",
    "gp_code": "GP214",
    "name": "วิเคราะห์ผลประโยชน์ทับซ้อน",
    "description": "ประเมิน ผลประโยชน์ทับซ้อน และมาตรการจัดการ",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP214 — วิเคราะห์ผลประโยชน์ทับซ้อน\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp215",
    "gp_code": "GP215",
    "name": "จัดทำรายการตรวจสอบด้านกฎหมาย",
    "description": "สร้างรายการตรวจพร้อมหลักฐานก่อน ระหว่าง และหลังดำเนินการ",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP215 — จัดทำรายการตรวจสอบด้านกฎหมาย\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp216",
    "gp_code": "GP216",
    "name": "วิเคราะห์ธรรมาภิบาลของโครงการ",
    "description": "ประเมินความโปร่งใส ความรับผิด การมีส่วนร่วม ความคุ้มค่า และความเสี่ยง",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP216 — วิเคราะห์ธรรมาภิบาลของโครงการ\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp217",
    "gp_code": "GP217",
    "name": "ตรวจสอบความเสี่ยงโครงการจัดซื้อจัดจ้าง",
    "description": "ประเมินกฎหมาย การแข่งขัน สัญญา และการตรวจสอบ",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP217 — ตรวจสอบความเสี่ยงโครงการจัดซื้อจัดจ้าง\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp218",
    "gp_code": "GP218",
    "name": "วิเคราะห์ประเด็น ป.ป.ช.",
    "description": "ประเมินความเสี่ยงด้านผลประโยชน์ทับซ้อน อำนาจ งบประมาณ และธรรมาภิบาล",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP218 — วิเคราะห์ประเด็น ป.ป.ช.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp219",
    "gp_code": "GP219",
    "name": "วิเคราะห์ประเด็น สตง.",
    "description": "ตรวจโครงการด้านกฎหมาย ความคุ้มค่า ประสิทธิภาพ และความโปร่งใส",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP219 — วิเคราะห์ประเด็น สตง.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp220",
    "gp_code": "GP220",
    "name": "วิเคราะห์หนังสือของ สตง.",
    "description": "สรุปสิ่งที่ สตง. ต้องการ เอกสาร ความเสี่ยง และแนวชี้แจง",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP220 — วิเคราะห์หนังสือของ สตง.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp221",
    "gp_code": "GP221",
    "name": "วิเคราะห์หนังสือ ป.ป.ช.",
    "description": "วิเคราะห์ประเด็นกล่าวหา หลักฐาน ความเสี่ยง และแนวชี้แจง",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP221 — วิเคราะห์หนังสือ ป.ป.ช.\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  },
  {
    "tool_id": "gp222",
    "gp_code": "GP222",
    "name": "ผู้ช่วยตรวจสอบงานภาครัฐแบบครบวงจร",
    "description": "ตรวจ การปฏิบัติตามกฎ ความเสี่ยง ธรรมาภิบาล และหน่วยตรวจสอบ",
    "group_code": "G11",
    "group_name": "งานตรวจสอบ ธรรมาภิบาล และการเตรียมรับการตรวจ",
    "preview": "GP222 — ผู้ช่วยตรวจสอบงานภาครัฐแบบครบวงจร\n\nกรอกข้อมูลสำคัญตามแบบฟอร์ม ระบบจะสร้าง Prompt พร้อมคัดลอก โดยยึดข้อเท็จจริงและทำเครื่องหมายข้อมูลที่ต้องตรวจสอบ",
    "form_fields": [
      {
        "id": "audit_topic",
        "label": "เรื่องหรือโครงการที่ตรวจสอบ",
        "type": "text",
        "required": true,
        "placeholder": "ระบุขอบเขตการตรวจ"
      },
      {
        "id": "agency",
        "label": "หน่วยงานและผู้รับผิดชอบ",
        "type": "text",
        "required": false,
        "placeholder": "ระบุหน่วยงาน"
      },
      {
        "id": "facts",
        "label": "ข้อเท็จจริงและสถานะการดำเนินงาน",
        "type": "textarea",
        "required": true,
        "placeholder": "วางข้อมูลที่ตรวจสอบได้"
      },
      {
        "id": "criteria",
        "label": "เกณฑ์ กฎหมาย ขอบเขตงาน หรือข้อกำหนด",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุเกณฑ์ที่ใช้ตรวจ"
      },
      {
        "id": "evidence",
        "label": "หลักฐานและเอกสารอ้างอิง",
        "type": "textarea",
        "required": true,
        "placeholder": "ระบุแฟ้ม รายงาน หรือหลักฐาน"
      },
      {
        "id": "concerns",
        "label": "ข้อสังเกต ความผิดปกติ หรือความเสี่ยง",
        "type": "textarea",
        "required": false,
        "placeholder": "ระบุประเด็นที่ต้องตรวจเพิ่ม"
      }
    ],
    "approval_status": "APPROVED",
    "version": "2.0"
  }
]