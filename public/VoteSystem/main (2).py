import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import datetime
import ntplib
import time
import csv
import os
import threading
import socket
import io
from flask import Flask, render_template_string, jsonify, request, send_file, send_from_directory
import qrcode
from PIL import Image, ImageTk

# Supabase Client Import (Optional / Graceful fallback)
try:
    from supabase import create_client as create_supabase_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

# ลอง import ระบบเสียง
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

import json
import ctypes

# ลงทะเบียนฟอนต์ THSarabunNew ถ้ามีไฟล์ในเครื่อง
FONT_TITLE = "TH Sarabun New"
FONT_TITLE_ALT = "TH SarabunPSK"
FONT_BODY = "Tahoma"

try:
    font_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts", "THSarabunNew.ttf"))
    if os.path.exists(font_path):
        ctypes.windll.gdi32.AddFontResourceExW(font_path, 0x10, 0)
except Exception as e:
    pass

# โหลดข้อมูลนักเรียน 52 คนจาก src/data/students.json
DEFAULT_STUDENTS = [
    "01 เด็กหญิงกัญญาวีร์ สินสมบูรณ์", "02 เด็กชายปัณณพัฒน์ สมสี", "03 เด็กชายสาทร รอดสำราญ", "04 เด็กหญิงพิชามญชุ์ ลลิตกุลธร", "05 เด็กชายวริทธิ์ธร เจนจิราจิรโชติ",
    "06 เด็กหญิงรัญชนา รงควิลิต", "07 เด็กชายปุญญะพัชญ์ โพธิ์ผลิ", "08 เด็กหญิงเปมิกา กำลังเสือ", "09 เด็กหญิงอัยย์รดา โกสวัสดิ์", "10 เด็กชายโปรดปราน ห้องสินหลาก",
    "11 เด็กชายกรพัฒน์ นันทวิจารณ์", "12 เด็กชายพาทิศ พวันนา", "13 เด็กชายรณกร แก้วนวล", "14 เด็กชายปภังกร จิตต์สมัย", "15 เด็กชายพัฒนวงษ์ แซ่ลี่",
    "16 เด็กชายนิพัฐพนธ์ ตัณฑ์เจริญ", "17 เด็กหญิงปุณยนุช กีรติกสิกร", "18 เด็กชายฐานพัฒน์ กิจนพเกียรติ", "19 เด็กชายปิติญาณ ทัศนกิจ", "20 เด็กหญิงวริษฐา ธิตยางกรุวงศ์",
    "21 เด็กหญิงอุรัสยา เหรียญประพันธ์", "22 เด็กชายโปรดปลื้ม พูลทรัพย์เจริญ", "23 เด็กชายองศา แถวเที่ยง", "24 เด็กชายชินภัทร ชวเลิศสกุล", "25 เด็กชายชวกร เทอดกตัญญูวงศ์",
    "26 เด็กหญิงธัญญวรัตน์ อัศวฤทธิรงค์", "27 เด็กชายรณกฤต เขียวคำรพ", "28 เด็กหญิงมารีลิน คงศักดิ์ศรีสกุล", "29 เด็กหญิงนิษฐ์ภิญญา เหลืองวิไล", "30 เด็กหญิงนันทรัตน์ จิตติเรืองวิชัย",
    "31 เด็กชายภูผา เสรีประยูร", "32 เด็กชายกิตติศักดิ์ หัตถมณฑล", "33 เด็กหญิงวรวลัญช์ สอนเฉลิม", "34 เด็กหญิงอดิศา อภิมนสิริ", "35 เด็กชายวชิระ ตั้งอมรรัตน์",
    "36 เด็กชายพัชรากร พลัดพริ้ง", "37 เด็กชายธนดิษ พรธนเกษม", "38 เด็กหญิงนนทพร แซ่โล้ว", "39 เด็กชายสิรภพ ทะประสพ", "40 เด็กหญิงณัฐฐธร ฉ่ำช้าง",
    "41 เด็กชายศิรวัฒน์ รอดดี", "42 เด็กชายพุธภพ อัลภาชน์", "43 เด็กชายธีรภัทร ลิ้มสงวน", "44 เด็กชายภัคพล วงศาริยวานิช", "45 เด็กชายอริยภัทร นุชจิระสุวรรณ",
    "46 เด็กหญิงพัทธ์ธีรา ปินสุวรรณบุตร", "47 เด็กชายปูรณ์ ปินสุวรรณบุตร", "48 เด็กชายนพดล เสมโมกข์สม", "49 เด็กชายศิขรินทร์ พุ่มผล", "50 เด็กชายภูรี สมประสงค์",
    "51 เด็กหญิงจิรัชญา ศิริสิทธิธงไชย", "52 เด็กหญิงนิศารัตน์ ดิถีศรีวรกุล"
]

def load_students_from_source():
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "students.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "students.json")),
    ]
    raw_list = []
    names_list = []
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        raw_list = data
                        for s in data:
                            no_str = f"{int(s.get('student_no', 0)):02d}"
                            fn = s.get('full_name')
                            if not fn:
                                fn = f"{s.get('prefix', '')}{s.get('first_name', '')} {s.get('last_name', '')}"
                            names_list.append(f"{no_str} {fn}".strip())
                        return names_list, raw_list
            except Exception:
                pass
    return DEFAULT_STUDENTS, []

STUDENTS, RAW_STUDENTS_LIST = load_students_from_source()

# --- Supabase 60-Day Logging & Retention System ---
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
supabase_client = None

if HAS_SUPABASE and SUPABASE_URL and SUPABASE_KEY and "placeholder" not in SUPABASE_URL:
    try:
        supabase_client = create_supabase_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print("Supabase init error:", e)

def log_to_supabase_async(record_type, student_id, student_name, agenda, choice_or_status):
    """
    Log votes and quorum attendance to Supabase with 60-day retention.
    Auto-purges records older than 60 days.
    """
    def _worker():
        # Always write to local JSON log as robust backup
        log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "logs"))
        try:
            os.makedirs(log_dir, exist_ok=True)
            log_file = os.path.join(log_dir, f"parliament_log_{datetime.date.today().strftime('%Y%m')}.jsonl")
            entry = {
                "timestamp": datetime.datetime.now().isoformat(),
                "record_type": record_type,
                "student_id": str(student_id),
                "student_name": student_name,
                "agenda": agenda,
                "value": choice_or_status
            }
            with open(log_file, "a", encoding="utf-8") as lf:
                lf.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            pass

        if not supabase_client:
            return

        try:
            # 1. Insert record
            supabase_client.table("parliament_votes").insert({
                "record_type": record_type,
                "student_id": str(student_id),
                "student_name": student_name,
                "agenda": agenda,
                "choice": choice_or_status,
                "created_at": datetime.datetime.utcnow().isoformat()
            }).execute()

            # 2. Cleanup records older than 60 days
            cutoff_date = (datetime.datetime.utcnow() - datetime.timedelta(days=60)).isoformat()
            supabase_client.table("parliament_votes").delete().lt("created_at", cutoff_date).execute()
        except Exception as err:
            # Silent fallback if table doesn't exist yet
            pass

    threading.Thread(target=_worker, daemon=True).start()

THAI_MONTHS = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]

COLOR_APPROVE = "#00E676"    
COLOR_DISAPPROVE = "#FF5252" 
COLOR_ABSTAIN = "#FFEB3B"    
COLOR_NOVOTE = "#9C27B0"     
COLOR_DEFAULT = "#424242"    

app_flask = Flask(__name__)

class SmartParliamentSystem:
    def __init__(self, root):
        self.root = root
        self.root.title("Smart Parliament Control Panel (Ultimate Edition)")
        self.root.geometry("1450x950")
        
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TNotebook.Tab', font=('Tahoma', 11, 'bold'), padding=[15, 5])

        self.time_offset = 0
        self.clock_running = False 
        
        self.display_mode = "QUORUM" 
        self.meeting_title = tk.StringVar(value="ระเบียบวาระที่ ๑ เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ")
        self.broadcast_text = tk.StringVar(value="รายการต่อไป ถ่ายทอดสด การประชุมคณะห้อง ๓ ชุดที่ 1 ปีที่ 2 ครั้งที่ 1")
        self.total_participants = tk.StringVar(value="52")
        self.ui_scale = tk.DoubleVar(value=1.0)
        self.is_system_open = tk.BooleanVar(value=True)
        self.elapsed_seconds = 0
        
        self.attendance_status = {name: False for name in STUDENTS}
        self.vote_status = {name: 'NONE' for name in STUDENTS}
        self.agenda_vote_states = {}
        
        self.speaker_queue = []
        self.current_speaker = tk.StringVar(value="")
        
        self.control_mode = tk.StringVar(value="QUORUM")
        self.current_vote_tool = tk.StringVar(value="APPROVE")
        
        self.timer_mins = tk.IntVar(value=15)
        self.timer_secs = tk.IntVar(value=0)
        self.timer_status = tk.StringVar(value="STOPPED")
        self.remaining_seconds = 0
        self.target_return_time = None

        self.display_window = None
        self.display_canvas = None
        self.motion_text_display = None 
        
        # 3-Click Recheck Quorum Tracker
        self.student_click_counters = {name: 0 for name in STUDENTS}
        self.recheck_quorum_counter = 0 
        
        self.sync_time_from_ntp()
        self.create_widgets()
        self.start_main_clock_loop()
        self.start_android_server()

    def get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

    def start_android_server(self):
        ip = self.get_local_ip()
        print(f"🌍 ระบบ Android Control เปิดทำงานที่: http://{ip}:5000")
        
        @app_flask.route('/')
        def remote_ui():
            html = """
            <!DOCTYPE html>
            <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Parliament Remote</title>
            <style>
                body { background: #121212; color: white; font-family: Tahoma, sans-serif; padding: 15px; margin: 0; }
                h3 { color: #00E676; margin-top: 20px; border-bottom: 1px solid #333; padding-bottom: 5px;}
                button { width: 100%; padding: 12px; margin: 5px 0; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; color: white; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
                .btn-green { background: #27ae60; } .btn-blue { background: #2980b9; } .btn-purple { background: #8e44ad; }
                .btn-gold { background: #d35400; } .btn-red { background: #c0392b; } .btn-gray { background: #34495e; }
                .btn-print { background: #ffffff; color: black; border: 2px dashed #00E676; margin-top: 10px;}
                input[type=text] { width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 6px; border: none; font-size: 16px; box-sizing: border-box;}
                .list-card { background: #1e1e1e; border-radius: 8px; padding: 10px; margin-top: 10px; max-height: 400px; overflow-y: auto; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                td, th { padding: 8px 4px; border-bottom: 1px solid #333; text-align: left; }
                th { color: #00BCD4; }
            </style>
            <script>
                function sendCmd(cmd) { fetch('/api/'+cmd); }
                function updateAgenda() {
                    let text = document.getElementById('agenda_in').value;
                    fetch('/api/agenda', {
                        method: 'POST', headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({title: text})
                    }).then(()=> alert('อัปเดตวาระขึ้นจอแล้ว!'));
                }
                function formatShortName(fullName) {
                    let parts = fullName.split(" ");
                    if (parts.length < 2) return fullName;
                    let num = parts[0];
                    let firstPart = parts[1];
                    let lastPart = parts.length > 2 ? parts[2] : "";
                    
                    let title = "";
                    let fname = firstPart;
                    if (firstPart.startsWith("เด็กหญิง")) { title = "ด.ญ."; fname = firstPart.replace("เด็กหญิง", ""); }
                    else if (firstPart.startsWith("เด็กชาย")) { title = "ด.ช."; fname = firstPart.replace("เด็กชาย", ""); }
                    
                    let shortLname = lastPart ? " " + lastPart.substring(0,2) + "." : "";
                    return num + " " + title + fname + shortLname;
                }
                function fetchList() {
                    fetch('/api/list').then(r=>r.json()).then(data => {
                        let html = '<table><tr><th>ลำดับ/ชื่อย่อ</th><th>มา/ขาด</th><th>การลงมติ</th></tr>';
                        data.forEach(s => {
                            let q = s.quorum ? "✅ มา" : "❌ ขาด";
                            let vColor = s.vote == "APPROVE" ? "color:#00E676" : (s.vote == "DISAPPROVE" ? "color:#FF5252" : "color:white");
                            let vText = {"APPROVE":"เห็นด้วย", "DISAPPROVE":"ไม่เห็นด้วย", "ABSTAIN":"งดออกเสียง", "NOVOTE":"ไม่ลงคะแนน", "NONE":"-"}[s.vote];
                            html += `<tr><td>${formatShortName(s.name)}</td><td>${q}</td><td style="${vColor}; font-weight:bold">${vText}</td></tr>`;
                        });
                        html += '</table>';
                        document.getElementById('student_list').innerHTML = html;
                    });
                }
                function printReceipt() { window.open('/print_58mm', '_blank'); }
            </script>
            </head><body onload="fetchList()">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h2 style="margin: 0; color: #00BCD4;">📱 Smart Remote</h2>
                </div>
                
                <h3>🎛️ ควบคุมหน้าจอ (Displays)</h3>
                <div class="grid-2">
                    <button class="btn-green" onclick="sendCmd('disp/QUORUM')">1. จอรายชื่อ</button>
                    <button class="btn-blue" onclick="sendCmd('disp/VOTE_GRID')">2. จอผลโหวต</button>
                    <button class="btn-purple" onclick="sendCmd('disp/SEAT_MAP')">3. ผังที่นั่ง</button>
                    <button class="btn-gold" onclick="sendCmd('disp/MOTION')">4. ร่างมติ (แปรญัตติ)</button>
                    <button class="btn-gray" onclick="sendCmd('disp/SPEAKER')">5. จอผู้อภิปราย</button>
                    <button class="btn-gray" onclick="sendCmd('disp/BREAK')">6. จอพักประชุม</button>
                </div>
                <button class="btn-gold" style="background:#b5874c; margin-top:10px;" onclick="sendCmd('disp/VOTE_RESULT_GOLD')">🏆 7. ผลมติทางการ</button>
                
                <h3>⏱️ ควบคุมเวลา (Timer)</h3>
                <div class="grid-3">
                    <button class="btn-green" onclick="sendCmd('time/start')">▶ Start</button>
                    <button class="btn-gold" style="background:#f1c40f; color:black;" onclick="sendCmd('time/pause')">⏸ Pause</button>
                    <button class="btn-red" onclick="sendCmd('time/reset')">⏹ Reset</button>
                </div>
                
                <h3>📝 เปลี่ยนวาระการประชุม</h3>
                <input type="text" id="agenda_in" placeholder="พิมพ์ชื่อวาระที่นี่...">
                <button class="btn-blue" onclick="updateAgenda()">อัปเดตวาระขึ้นจอภาพ</button>
                
                <h3>🖨️ ระบบรายงาน</h3>
                <button class="btn-print" onclick="printReceipt()">🖨️ พิมพ์สลิปรายงาน (58mm Thermal)</button>
                
                <h3>📋 ตรวจสอบรายชื่อ & สถานะโหวต</h3>
                <button class="btn-gray" onclick="fetchList()">🔄 รีเฟรชรายชื่อล่าสุด</button>
                <div class="list-card" id="student_list">
                    <!-- รายชื่อจะโผล่ที่นี่ -->
                </div>
            </body></html>
            """
            return render_template_string(html)

        @app_flask.route('/student')
        @app_flask.route('/vote')
        def student_page():
            student_html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "student.html"))
            if os.path.exists(student_html_path):
                with open(student_html_path, "r", encoding="utf-8") as f:
                    return f.read()
            return "Student page not found", 404

        @app_flask.route('/remote')
        def remote_alias():
            return remote_ui()

        @app_flask.route('/api/students_data')
        def api_students_data():
            if RAW_STUDENTS_LIST:
                return jsonify(RAW_STUDENTS_LIST)
            # Fallback construct
            res = []
            for i, name in enumerate(STUDENTS):
                res.append({
                    "student_id": f"302{i+10:02d}",
                    "student_no": i + 1,
                    "full_name": name,
                    "nickname": ""
                })
            return jsonify(res)

        @app_flask.route('/api/state')
        def api_state():
            s_id = request.args.get('student_id', '')
            s_no = request.args.get('student_no', '')
            
            # Find matching student name
            matched_name = None
            if s_no:
                try:
                    target_no = int(s_no)
                    for n in STUDENTS:
                        if n.startswith(f"{target_no:02d} "):
                            matched_name = n
                            break
                except:
                    pass

            if not matched_name and s_id:
                for raw in RAW_STUDENTS_LIST:
                    if str(raw.get('student_id')) == str(s_id):
                        t_no = raw.get('student_no')
                        for n in STUDENTS:
                            if n.startswith(f"{int(t_no):02d} "):
                                matched_name = n
                                break
                        break

            my_vote = self.vote_status.get(matched_name, "NONE") if matched_name else "NONE"
            has_checked_quorum = self.attendance_status.get(matched_name, False) if matched_name else False
            
            # Format timer string
            status = self.timer_status.get()
            secs = self.remaining_seconds if status != "STOPPED" else ((self.timer_mins.get() * 60) + self.timer_secs.get())
            timer_str = self.get_time_string(secs)

            # Motion text & tags
            motion_text = ""
            try:
                if hasattr(self, 'motion_editor'):
                    motion_text = self.motion_editor.get("1.0", tk.END).strip()
            except:
                pass

            is_in_queue = False
            if matched_name:
                is_in_queue = matched_name in self.speaker_queue

            return jsonify({
                "agenda": self.meeting_title.get(),
                "display_mode": self.display_mode,
                "control_mode": self.control_mode.get(),
                "is_system_open": self.is_system_open.get(),
                "timer_status": status,
                "timer_str": timer_str,
                "remaining_seconds": secs,
                "has_checked_quorum": has_checked_quorum,
                "my_vote": my_vote,
                "current_speaker": self.current_speaker.get(),
                "is_in_speaker_queue": is_in_queue,
                "motion_text": motion_text,
                "recheck_quorum_counter": self.recheck_quorum_counter
            })

        @app_flask.route('/api/student/quorum', methods=['POST'])
        def api_student_quorum():
            if not self.is_system_open.get():
                return jsonify({"status": "error", "message": "ระบบถูกปิดอยู่"}), 403
            data = request.json or {}
            s_no = data.get('student_no')
            s_id = data.get('student_id')
            s_name = data.get('student_name', '')
            status = data.get('status', True)

            matched_name = None
            if s_no:
                try:
                    target_no = int(s_no)
                    for n in STUDENTS:
                        if n.startswith(f"{target_no:02d} "):
                            matched_name = n
                            break
                except:
                    pass

            if matched_name:
                def _do_update():
                    self.attendance_status[matched_name] = status
                    self.refresh_grid_buttons()
                    self.force_render()
                self.root.after(0, _do_update)
                log_to_supabase_async("QUORUM", s_id or s_no, s_name or matched_name, self.meeting_title.get(), "PRESENT" if status else "ABSENT")
                return jsonify({"status": "ok", "student": matched_name, "quorum": status})
            return jsonify({"status": "error", "message": "ไม่พบรายชื่อ"}), 404

        @app_flask.route('/api/student/vote', methods=['POST'])
        def api_student_vote():
            if not self.is_system_open.get():
                return jsonify({"status": "error", "message": "ระบบถูกปิดอยู่"}), 403
            data = request.json or {}
            s_no = data.get('student_no')
            s_id = data.get('student_id')
            s_name = data.get('student_name', '')
            choice = data.get('choice', 'NONE')

            matched_name = None
            if s_no:
                try:
                    target_no = int(s_no)
                    for n in STUDENTS:
                        if n.startswith(f"{target_no:02d} "):
                            matched_name = n
                            break
                except:
                    pass

            if matched_name:
                def _do_vote():
                    self.vote_status[matched_name] = choice
                    self.refresh_grid_buttons()
                    self.force_render()
                self.root.after(0, _do_vote)
                log_to_supabase_async("VOTE", s_id or s_no, s_name or matched_name, self.meeting_title.get(), choice)
                return jsonify({"status": "ok", "student": matched_name, "choice": choice})
            return jsonify({"status": "error", "message": "ไม่พบรายชื่อ"}), 404

        @app_flask.route('/api/student/speaker_queue', methods=['POST'])
        def api_student_speaker():
            data = request.json or {}
            s_name = data.get('student_name', '')
            s_id = data.get('student_id', '')

            matched_name = None
            for n in STUDENTS:
                if s_name and (s_name in n or n in s_name):
                    matched_name = n
                    break

            if not matched_name and s_id:
                for raw in RAW_STUDENTS_LIST:
                    if str(raw.get('student_id')) == str(s_id):
                        t_no = raw.get('student_no')
                        for n in STUDENTS:
                            if n.startswith(f"{int(t_no):02d} "):
                                matched_name = n
                                break
                        break

            if matched_name:
                def _do_queue():
                    if matched_name not in self.speaker_queue:
                        self.speaker_queue.append(matched_name)
                        if hasattr(self, 'listbox_queue'):
                            self.listbox_queue.insert(tk.END, matched_name)
                    else:
                        self.speaker_queue.remove(matched_name)
                        if hasattr(self, 'listbox_queue'):
                            for idx in range(self.listbox_queue.size()):
                                if self.listbox_queue.get(idx) == matched_name:
                                    self.listbox_queue.delete(idx)
                                    break
                self.root.after(0, _do_queue)
                status_res = "removed" if matched_name in self.speaker_queue else "added"
                return jsonify({"status": status_res, "name": matched_name})
            return jsonify({"status": "error"}), 404

        @app_flask.route('/api/qrcode.png')
        def api_qrcode():
            target_url = f"http://{self.get_local_ip()}:5000/student"
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=10,
                border=4,
            )
            qr.add_data(target_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#0f172a", back_color="white")
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            buf.seek(0)
            return send_file(buf, mimetype='image/png')

        @app_flask.route('/api/disp/<mode>')
        def api_disp(mode):
            self.root.after(0, lambda: self.open_display(mode))
            return "OK"

        @app_flask.route('/api/time/<cmd>')
        def api_time(cmd):
            if cmd == "start": self.root.after(0, self.start_timer)
            elif cmd == "pause": self.root.after(0, self.pause_timer)
            elif cmd == "reset": self.root.after(0, self.reset_timer)
            return "OK"
            
        @app_flask.route('/api/agenda', methods=['POST'])
        def api_agenda():
            data = request.json
            if data and 'title' in data:
                def update_title():
                    self.meeting_title.set(data['title'])
                    self.force_render()
                self.root.after(0, update_title)
            return jsonify({"status": "ok"})
            
        @app_flask.route('/api/list')
        def api_get_list():
            res = []
            for n in STUDENTS:
                res.append({
                    "name": n,
                    "quorum": self.attendance_status[n],
                    "vote": self.vote_status[n]
                })
            return jsonify(res)

        @app_flask.route('/print_58mm')
        def print_58mm():
            present = sum(self.attendance_status.values())
            total = self.total_participants.get()
            app_v = sum(1 for v in self.vote_status.values() if v == "APPROVE")
            dis = sum(1 for v in self.vote_status.values() if v == "DISAPPROVE")
            abs_v = sum(1 for v in self.vote_status.values() if v == "ABSTAIN")
            no_v = sum(1 for v in self.vote_status.values() if v == "NOVOTE")
            date_str = datetime.datetime.now().strftime('%d/%m/%Y %H:%M')
            
            student_rows = ""
            status_th = {"APPROVE": "เห็นด้วย", "DISAPPROVE": "ไม่เห็นด้วย", "ABSTAIN": "งดออกเสียง", "NOVOTE": "ไม่ลงคะแนน", "NONE": "-"}
            for name in STUDENTS:
                q = "มา" if self.attendance_status[name] else "ขาด"
                v = status_th[self.vote_status[name]]
                
                parts = name.split(" ")
                num = parts[0]
                first_part = parts[1] if len(parts) > 1 else ""
                last_part = parts[2] if len(parts) > 2 else ""
                
                if first_part.startswith("เด็กหญิง"):
                    title = "ด.ญ."
                    fname = first_part.replace("เด็กหญิง", "")
                elif first_part.startswith("เด็กชาย"):
                    title = "ด.ช."
                    fname = first_part.replace("เด็กชาย", "")
                else:
                    title = ""
                    fname = first_part
                    
                short_lname = last_part[:2] + "." if last_part else ""
                short_name = f"{title}{fname} {short_lname}"
                
                student_rows += f"<tr><td>{num} {short_name}</td><td class='right'>{q}/{v}</td></tr>"

            receipt_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Print 58mm</title>
                <style>
                    @page {{ margin: 0; size: 58mm auto; }}
                    body {{ font-family: 'Tahoma', sans-serif; font-size: 11px; width: 48mm; margin: 0 auto; padding: 5mm 0; color: black; background: white; line-height: 1.3; }}
                    h3 {{ text-align: center; font-size: 13px; margin: 0 0 5px 0; }}
                    .center {{ text-align: center; }}
                    .line {{ border-bottom: 1px dashed black; margin: 5px 0; }}
                    table {{ width: 100%; font-size: 10px; border-collapse: collapse; }}
                    td {{ padding: 2px 0; vertical-align: top; border-bottom: 1px dotted #ccc;}}
                    .right {{ text-align: right; }}
                    .bold {{ font-weight: bold; }}
                </style>
            </head>
            <body onload="window.print(); window.onafterprint = function(){{window.close();}}">
                <h3>รายงานมติที่ประชุม</h3>
                <div class="line"></div>
                <p style="margin: 2px 0;">วาระ: {self.meeting_title.get()}</p>
                <p style="margin: 2px 0;">วันที่: {date_str}</p>
                <div class="line"></div>
                <table>
                    <tr><td>มาประชุม</td><td class="right">{present}/{total}</td></tr>
                    <tr><td class="bold">เห็นด้วย</td><td class="right bold">{app_v}</td></tr>
                    <tr><td>ไม่เห็นด้วย</td><td class="right">{dis}</td></tr>
                    <tr><td>งดออกเสียง</td><td class="right">{abs_v}</td></tr>
                    <tr><td>ไม่ลงคะแนน</td><td class="right">{no_v}</td></tr>
                </table>
                <div class="line"></div>
                <div class="center" style="font-weight: bold; margin: 5px 0;">รายละเอียดรายบุคคล</div>
                <table>
                    {student_rows}
                </table>
                <div class="line"></div>
                <div class="center" style="font-size: 12px; font-weight: bold; margin-top: 10px; margin-bottom: 10px;">
                    สภากรุงเทพมหานคร
                </div>
            </body>
            </html>
            """
            return render_template_string(receipt_html)

        threading.Thread(target=lambda: app_flask.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False), daemon=True).start()

    def sync_time_from_ntp(self):
        try:
            self.time_offset = ntplib.NTPClient().request('time1.nimt.or.th', version=3, timeout=2).tx_time - time.time()
        except:
            self.time_offset = 0

    def get_current_time(self):
        return datetime.datetime.fromtimestamp(time.time() + self.time_offset)

    def play_end_sound(self):
        if HAS_WINSOUND:
            winsound.Beep(600, 300)
            time.sleep(0.1)
            winsound.Beep(800, 600)

    def end_meeting(self):
        self.reset_timer()
        self.open_display("END_MEETING")
        self.play_end_sound()

    def show_qr_popup(self):
        # Official Primjaa domain URL
        url = "https://primjaa.bungkii.app/vote"
        local_url = f"http://{self.get_local_ip()}:5000/student"
        
        qr_win = tk.Toplevel(self.root)
        qr_win.title("QR Code สำหรับนักเรียนเข้าสู่ระบบโหวต")
        qr_win.geometry("480x600")
        qr_win.configure(bg="#ffffff")
        qr_win.resizable(False, False)

        tk.Label(qr_win, text="📷 สแกน QR Code เข้าเว็บพริมจ๋า", font=("Prompt", 16, "bold"), bg="#ffffff", fg="#0f172a").pack(pady=(20, 5))
        tk.Label(qr_win, text="ห้อง ม.2/3 • ระบบพริมจ๋า VOTE (Deploy)", font=("Prompt", 11), bg="#ffffff", fg="#e11d48").pack(pady=(0, 15))

        # Generate QR Code Image pointing to the Primjaa URL
        try:
            qr = qrcode.QRCode(box_size=8, border=2)
            qr.add_data(url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#0f172a", back_color="white")
            
            photo = ImageTk.PhotoImage(img)
            qr_lbl = tk.Label(qr_win, image=photo, bg="#ffffff")
            qr_lbl.image = photo  # Keep reference
            qr_lbl.pack(pady=5)
        except Exception as e:
            tk.Label(qr_win, text=f"Error generating QR: {e}", bg="#ffffff", fg="red").pack(pady=10)

        url_frame = tk.Frame(qr_win, bg="#f8fafc", padx=12, pady=10, relief="groove", bd=1)
        url_frame.pack(fill="x", padx=25, pady=8)
        tk.Label(url_frame, text="🌐 ลิงก์ระบบพริมจ๋า (Deploy):", font=("Tahoma", 9, "bold"), bg="#f8fafc", fg="#64748b").pack(anchor="w")
        tk.Label(url_frame, text=url, font=("Tahoma", 12, "bold"), bg="#f8fafc", fg="#4f46e5").pack(anchor="w", pady=(2, 4))
        tk.Label(url_frame, text=f"หรือเข้าตรง: https://primjaa.bungkii.app/VoteSystem/student.html", font=("Tahoma", 8), bg="#f8fafc", fg="#0284c7").pack(anchor="w")

        tk.Label(qr_win, text="* สแกนแล้วใส่เลขประจำตัว 5 หลัก เพื่อผูกบัญชีกับเครื่องถาวร (ไม่มีปุ่มล็อกเอาท์)", font=("Tahoma", 9), bg="#ffffff", fg="#64748b").pack(pady=4)
        tk.Button(qr_win, text="ปิดหน้าต่าง", command=qr_win.destroy, bg="#334155", fg="white", font=("Tahoma", 10, "bold"), relief="flat", padx=20, pady=5).pack(pady=8)

    def create_widgets(self):
        top_frame = tk.Frame(self.root, padx=10, pady=10, bg="#2c3e50")
        top_frame.pack(fill="x")
        
        def btn_style(bg): return {"bg": bg, "fg": "white", "font": ("Tahoma", 9, "bold"), "relief": "flat", "padx": 6, "pady": 5}
        
        tk.Button(top_frame, text="💻 1.รายชื่อ", command=lambda: self.open_display("QUORUM"), **btn_style("#27ae60")).pack(side="left", padx=2)
        tk.Button(top_frame, text="📊 2.ผลโหวต", command=lambda: self.open_display("VOTE_GRID"), **btn_style("#2980b9")).pack(side="left", padx=2)
        tk.Button(top_frame, text="🪑 3.ผังที่นั่ง", command=lambda: self.open_display("SEAT_MAP"), **btn_style("#8e44ad")).pack(side="left", padx=2)
        tk.Button(top_frame, text="📜 4.ร่างมติ", command=lambda: self.open_display("MOTION"), **btn_style("#d35400")).pack(side="left", padx=2)
        tk.Button(top_frame, text="🎙️ 5.อภิปราย", command=lambda: self.open_display("SPEAKER"), **btn_style("#f39c12")).pack(side="left", padx=2)
        tk.Button(top_frame, text="☕ 6.พักประชุม", command=lambda: self.open_display("BREAK"), **btn_style("#34495e")).pack(side="left", padx=2)
        tk.Button(top_frame, text="🏆 7.มติทางการ", command=lambda: self.open_display("VOTE_RESULT_GOLD"), **btn_style("#b5874c")).pack(side="left", padx=2)
        tk.Button(top_frame, text="🎥 8.รอถ่ายทอดสด", command=lambda: self.open_display("STANDBY"), **btn_style("#455A64")).pack(side="left", padx=2)
        
        tk.Button(top_frame, text="🛑 9.จบประชุม", command=self.end_meeting, **btn_style("#D50000")).pack(side="left", padx=(15,2))

        # QR Code Button to scan and vote
        tk.Button(top_frame, text="📷 สแกน QR เข้าเว็บ", command=self.show_qr_popup, **btn_style("#8b5cf6")).pack(side="left", padx=(10,2))

        tk.Label(top_frame, text="🌐 https://primjaa.bungkii.app/vote", bg="#2c3e50", fg="#00E676", font=("Tahoma", 10, "bold")).pack(side="right", padx=10)

        timer_frame = tk.LabelFrame(self.root, text="ระบบจับเวลาส่วนกลาง (ตัวเลขจะนับถอยหลังอัตโนมัติ)", padx=10, pady=8, font=("Tahoma", 10, "bold"))
        timer_frame.pack(fill="x", padx=10, pady=5)
        
        time_f = tk.Frame(timer_frame)
        time_f.pack(side="left")
        tk.Label(time_f, text="นาที:", font=("Tahoma", 10)).pack(side="left")
        tk.Entry(time_f, textvariable=self.timer_mins, width=3, font=("Tahoma", 10, "bold"), justify="center").pack(side="left", padx=2)
        tk.Label(time_f, text="วิ:", font=("Tahoma", 10)).pack(side="left", padx=(5,2))
        tk.Entry(time_f, textvariable=self.timer_secs, width=3, font=("Tahoma", 10, "bold"), justify="center").pack(side="left", padx=2)
        
        ctrl_f = tk.Frame(timer_frame)
        ctrl_f.pack(side="left", padx=20)
        tk.Button(ctrl_f, text="▶ Start", command=self.start_timer, bg="#27ae60", fg="white", font=("Tahoma", 9, "bold")).pack(side="left", padx=2)
        tk.Button(ctrl_f, text="⏸ Pause", command=self.pause_timer, bg="#f1c40f", font=("Tahoma", 9, "bold")).pack(side="left", padx=2)
        tk.Button(ctrl_f, text="⏹ Reset", command=self.reset_timer, bg="#e74c3c", fg="white", font=("Tahoma", 9, "bold")).pack(side="left", padx=2)
        
        adj_f = tk.Frame(timer_frame)
        adj_f.pack(side="left", padx=20)
        btn_adj_style = {"font": ("Tahoma", 9, "bold"), "bg": "#ecf0f1", "relief": "groove"}
        tk.Button(adj_f, text="- 1 นาที", command=lambda: self.adjust_timer(-60), **btn_adj_style).pack(side="left", padx=2)
        tk.Button(adj_f, text="+ 1 นาที", command=lambda: self.adjust_timer(60), **btn_adj_style).pack(side="left", padx=2)
        tk.Button(adj_f, text="- 10 วิ", command=lambda: self.adjust_timer(-10), **btn_adj_style).pack(side="left", padx=2)
        tk.Button(adj_f, text="+ 10 วิ", command=lambda: self.adjust_timer(10), **btn_adj_style).pack(side="left", padx=2)

        scale_f = tk.Frame(timer_frame)
        scale_f.pack(side="right", padx=10)
        tk.Label(scale_f, text="Scale จอ:", font=("Tahoma", 10)).pack(side="left")
        tk.Scale(scale_f, variable=self.ui_scale, from_=0.5, to=2.0, resolution=0.1, orient="horizontal", command=lambda v: self.force_render(), length=120).pack(side="left")

        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=10)

        self.tab_main = tk.Frame(self.notebook)
        self.notebook.add(self.tab_main, text="📋 เช็คชื่อ / ลงมติ")
        self.build_main_tab()

        self.tab_motion = tk.Frame(self.notebook)
        self.notebook.add(self.tab_motion, text="📜 ร่างมติ & แปรญัตติ")
        self.build_motion_tab()

        self.tab_agenda = tk.Frame(self.notebook)
        self.notebook.add(self.tab_agenda, text="📑 จัดการวาระ")
        self.build_agenda_tab()

        self.tab_speaker = tk.Frame(self.notebook)
        self.notebook.add(self.tab_speaker, text="🎙️ คิวอภิปราย")
        self.build_speaker_tab()

    def build_main_tab(self):
        header_frame = tk.LabelFrame(self.tab_main, text="ข้อมูลวาระและรายการ", font=("Tahoma", 10, "bold"))
        header_frame.pack(fill="x", padx=10, pady=5)
        
        tk.Label(header_frame, text="หัวข้อที่กำลังแสดง:", font=("Tahoma", 10)).grid(row=0, column=0, sticky="e", padx=5, pady=5)
        tk.Entry(header_frame, textvariable=self.meeting_title, width=80, font=("Tahoma", 11)).grid(row=0, column=1, sticky="w", padx=5, pady=5)
        self.meeting_title.trace_add("write", lambda *args: self.force_render())

        tk.Label(header_frame, text="ข้อความรอถ่ายทอดสด:", font=("Tahoma", 10)).grid(row=1, column=0, sticky="e", padx=5, pady=5)
        tk.Entry(header_frame, textvariable=self.broadcast_text, width=80, font=("Tahoma", 11)).grid(row=1, column=1, sticky="w", padx=5, pady=5)
        sys_toggle_frame = tk.Frame(header_frame)
        sys_toggle_frame.grid(row=2, column=0, columnspan=2, sticky="w", padx=5, pady=5)
        tk.Label(sys_toggle_frame, text="สถานะระบบ:", font=("Tahoma", 10, "bold")).pack(side="left")
        
        self.btn_sys_open = tk.Button(sys_toggle_frame, text="🟢 เปิดระบบ", command=lambda: self.set_system_status(True), bg="#27ae60", fg="white", font=("Tahoma", 9, "bold"), relief="flat", padx=10)
        self.btn_sys_open.pack(side="left", padx=5)
        
        self.btn_sys_close = tk.Button(sys_toggle_frame, text="🔴 ปิดระบบ", command=lambda: self.set_system_status(False), bg="#ecf0f1", fg="#7f8c8d", font=("Tahoma", 9, "bold"), relief="flat", padx=10)
        self.btn_sys_close.pack(side="left", padx=5)

        tk.Button(sys_toggle_frame, text="✅ มาทุกคน", command=lambda: self.set_all_presence(True), bg="#34495e", fg="white", font=("Tahoma", 9), relief="flat", padx=8).pack(side="left", padx=(25, 2))
        tk.Button(sys_toggle_frame, text="❌ ขาดทุกคน", command=lambda: self.set_all_presence(False), bg="#7f8c8d", fg="white", font=("Tahoma", 9), relief="flat", padx=8).pack(side="left", padx=2)

        control_frame = tk.LabelFrame(self.tab_main, text="สลับโหมดแป้นกด", font=("Tahoma", 10, "bold"))
        control_frame.pack(fill="x", padx=10, pady=5)
        tk.Radiobutton(control_frame, text="นับองค์ประชุม (สีเขียว)", variable=self.control_mode, value="QUORUM", command=self.refresh_grid_buttons, font=("Tahoma", 10, "bold")).pack(side="left", padx=15)
        tk.Radiobutton(control_frame, text="ลงคะแนนโหวต", variable=self.control_mode, value="VOTE", command=self.refresh_grid_buttons, font=("Tahoma", 10, "bold")).pack(side="left", padx=15)
        
        tool_frame = tk.Frame(control_frame)
        tool_frame.pack(side="right", padx=10)
        tk.Label(tool_frame, text="เครื่องมือให้คะแนน:", font=("Tahoma", 10)).pack(side="left")
        for txt, val, col in [("เห็นชอบ", "APPROVE", "#00E676"), ("ไม่เห็นชอบ", "DISAPPROVE", "#FF5252"), ("งดออกเสียง", "ABSTAIN", "#FBC02D"), ("ไม่ลงคะแนน", "NOVOTE", "#9C27B0")]:
            tk.Radiobutton(tool_frame, text=txt, variable=self.current_vote_tool, value=val, fg=col, font=("Tahoma", 10, "bold")).pack(side="left")
        tk.Radiobutton(tool_frame, text="ล้างค่า", variable=self.current_vote_tool, value="NONE", font=("Tahoma", 10)).pack(side="left")

        canvas_scroll = tk.Canvas(self.tab_main, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self.tab_main, orient="vertical", command=canvas_scroll.yview)
        scrollable_frame = ttk.Frame(canvas_scroll)
        scrollable_frame.bind("<Configure>", lambda e: canvas_scroll.configure(scrollregion=canvas_scroll.bbox("all")))
        canvas_scroll.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas_scroll.configure(yscrollcommand=scrollbar.set)
        canvas_scroll.pack(side="left", fill="both", expand=True, padx=10, pady=5)
        scrollbar.pack(side="right", fill="y", pady=5)

        self.buttons = {}
        for i, name in enumerate(STUDENTS):
            btn = tk.Button(scrollable_frame, text=name, width=32, height=2, bg=COLOR_DEFAULT, fg="white", font=("Tahoma", 9), command=lambda n=name: self.handle_button_click(n))
            btn.grid(row=i // 4, column=i % 4, padx=4, pady=4)
            self.buttons[name] = btn

    def build_motion_tab(self):
        frame = tk.Frame(self.tab_motion, padx=20, pady=20)
        frame.pack(fill="both", expand=True)
        
        toolbar = tk.Frame(frame)
        toolbar.pack(fill="x", pady=5)
        tk.Label(toolbar, text="ร่างมติ / ร่างกฎหมาย (พิมพ์สดขึ้นจอได้เลย):", font=("Tahoma", 10, "bold")).pack(side="left")
        
        def apply_tag(tag_name):
            try:
                self.motion_editor.tag_add(tag_name, tk.SEL_FIRST, tk.SEL_LAST)
                self.sync_motion_text()
            except tk.TclError: pass 
            
        def clear_tags():
            try:
                for tag in ["strike_red", "highlight"]:
                    self.motion_editor.tag_remove(tag, tk.SEL_FIRST, tk.SEL_LAST)
                self.sync_motion_text()
            except tk.TclError: pass

        tk.Button(toolbar, text="[S] ขีดฆ่าตัวแดง (ขอตัดออก)", command=lambda: apply_tag("strike_red"), bg="#FF5252", fg="white", font=("Tahoma", 9, "bold")).pack(side="right", padx=2)
        tk.Button(toolbar, text="[H] ไฮไลท์เหลือง (ขอเพิ่มคำ)", command=lambda: apply_tag("highlight"), bg="#FFEB3B", fg="black", font=("Tahoma", 9, "bold")).pack(side="right", padx=2)
        tk.Button(toolbar, text="ล้างไฮไลท์", command=clear_tags, bg="#ecf0f1", font=("Tahoma", 9)).pack(side="right", padx=10)

        self.motion_editor = tk.Text(frame, font=("Tahoma", 16), wrap="word", padx=10, pady=10)
        self.motion_editor.pack(fill="both", expand=True)
        
        self.motion_editor.tag_configure("strike_red", overstrike=True, foreground="#FF5252")
        self.motion_editor.tag_configure("highlight", background="#FFEB3B", foreground="black")
        self.motion_editor.insert(tk.END, "ร่างข้อบัญญัติกรุงเทพมหานคร เรื่อง การบริหารจัดการขยะมูลฝอย\n\nข้อ ๑. ให้ผู้กระทำผิดปรับเป็นเงินจำนวน ๒,๐๐๐ บาท")
        self.motion_editor.bind("<KeyRelease>", lambda e: self.sync_motion_text())

    def sync_motion_text(self):
        if self.display_mode == "MOTION" and self.motion_text_display and self.display_window.winfo_exists():
            self.motion_text_display.config(state=tk.NORMAL)
            self.motion_text_display.delete(1.0, tk.END)
            self.motion_text_display.insert(tk.END, self.motion_editor.get(1.0, tk.END))
            for tag in ["strike_red", "highlight"]:
                ranges = self.motion_editor.tag_ranges(tag)
                for i in range(0, len(ranges), 2):
                    self.motion_text_display.tag_add(tag, ranges[i], ranges[i+1])
            self.motion_text_display.config(state=tk.DISABLED)

    def build_agenda_tab(self):
        frame = tk.Frame(self.tab_agenda, padx=20, pady=20)
        frame.pack(fill="both", expand=True)
        tk.Label(frame, text="พิมพ์เพิ่มวาระใหม่:", font=("Tahoma", 10, "bold")).pack(anchor="w")
        entry_agenda = tk.Entry(frame, width=80, font=("Tahoma", 11))
        entry_agenda.pack(anchor="w", pady=5)
        
        def add_agenda():
            txt = entry_agenda.get()
            if txt:
                self.listbox_agenda.insert(tk.END, txt)
                entry_agenda.delete(0, tk.END)
                
        def load_to_edit():
            sel = self.listbox_agenda.curselection()
            if sel:
                entry_agenda.delete(0, tk.END)
                entry_agenda.insert(0, self.listbox_agenda.get(sel[0]))

        def update_agenda():
            sel = self.listbox_agenda.curselection()
            txt = entry_agenda.get()
            if sel and txt:
                old_txt = self.listbox_agenda.get(sel[0])
                self.listbox_agenda.delete(sel[0])
                self.listbox_agenda.insert(sel[0], txt)
                if old_txt in self.agenda_vote_states:
                    self.agenda_vote_states[txt] = self.agenda_vote_states.pop(old_txt)
                if self.meeting_title.get() == old_txt:
                    self.meeting_title.set(txt)
                entry_agenda.delete(0, tk.END)
                messagebox.showinfo("สำเร็จ", "บันทึกการแก้ไขวาระเรียบร้อยแล้ว")

        def delete_agenda():
            sel = self.listbox_agenda.curselection()
            if sel:
                txt = self.listbox_agenda.get(sel[0])
                self.listbox_agenda.delete(sel[0])
                if txt in self.agenda_vote_states:
                    del self.agenda_vote_states[txt]
                
        btn_f = tk.Frame(frame)
        btn_f.pack(anchor="w", pady=5)
        tk.Button(btn_f, text="➕ เพิ่มเข้าลิสต์", command=add_agenda, bg="#27ae60", fg="white", font=("Tahoma", 10, "bold")).pack(side="left", padx=2)
        tk.Button(btn_f, text="✏️ ดึงมาแก้ไข", command=load_to_edit, bg="#f39c12", fg="white", font=("Tahoma", 10, "bold")).pack(side="left", padx=2)
        tk.Button(btn_f, text="💾 บันทึกแก้ไข", command=update_agenda, bg="#2980b9", fg="white", font=("Tahoma", 10, "bold")).pack(side="left", padx=2)
        tk.Button(btn_f, text="🗑️ ลบวาระ", command=delete_agenda, bg="#e74c3c", fg="white", font=("Tahoma", 10, "bold")).pack(side="left", padx=2)
        
        tk.Label(frame, text="รายการวาระ (List):", font=("Tahoma", 10, "bold")).pack(anchor="w", pady=(15,0))
        self.listbox_agenda = tk.Listbox(frame, width=80, height=15, font=("Tahoma", 11))
        self.listbox_agenda.pack(anchor="w", pady=5)
        self.listbox_agenda.insert(tk.END, "ระเบียบวาระที่ ๑ เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ")
        self.listbox_agenda.insert(tk.END, "ระเบียบวาระที่ ๒ รับรองรายงานการประชุมครั้งที่ผ่านมา")
        
        def set_active_agenda():
            sel = self.listbox_agenda.curselection()
            if sel:
                new_agenda = self.listbox_agenda.get(sel[0])
                current_agenda = self.meeting_title.get()
                self.agenda_vote_states[current_agenda] = self.vote_status.copy()
                if new_agenda in self.agenda_vote_states:
                    self.vote_status = self.agenda_vote_states[new_agenda].copy()
                else:
                    self.vote_status = {name: 'NONE' for name in STUDENTS}
                self.meeting_title.set(new_agenda)
                self.refresh_grid_buttons()
                self.force_render()

        tk.Button(frame, text="▶ ใช้วาระนี้แสดงบนจอภาพ", command=set_active_agenda, bg="#8e44ad", fg="white", font=("Tahoma", 11, "bold")).pack(anchor="w", pady=10)

    def build_speaker_tab(self):
        frame = tk.Frame(self.tab_speaker, padx=20, pady=20)
        frame.pack(fill="both", expand=True)
        left_f = tk.Frame(frame)
        left_f.pack(side="left", fill="y", padx=20)
        
        tk.Label(left_f, text="ค้นหา/เลือกผู้ขออภิปราย:", font=("Tahoma", 10, "bold")).pack(anchor="w")
        self.combo_speaker = ttk.Combobox(left_f, values=STUDENTS, width=40, font=("Tahoma", 11))
        self.combo_speaker.pack(pady=5)
        
        def add_speaker():
            if self.combo_speaker.get():
                self.listbox_queue.insert(tk.END, self.combo_speaker.get())
                self.combo_speaker.set("")
                
        tk.Button(left_f, text="เพิ่มเข้าคิว", command=add_speaker, bg="#27ae60", fg="white", font=("Tahoma", 10, "bold")).pack(anchor="w")
        tk.Label(left_f, text="คิวรอพูด (Queue):", font=("Tahoma", 10, "bold")).pack(anchor="w", pady=(20,0))
        self.listbox_queue = tk.Listbox(left_f, width=40, height=15, font=("Tahoma", 11))
        self.listbox_queue.pack(pady=5)
        
        right_f = tk.LabelFrame(frame, text="แผงควบคุมหน้าจอผู้อภิปราย", padx=20, pady=20, font=("Tahoma", 10, "bold"))
        right_f.pack(side="left", fill="both", expand=True, padx=20)
        tk.Label(right_f, text="ผู้ที่กำลังอภิปรายบนจอ:", font=("Tahoma", 11)).pack()
        self.lbl_current_speaker = tk.Label(right_f, text="- ว่าง -", font=("Tahoma", 18, "bold"), fg="#2980b9")
        self.lbl_current_speaker.pack(pady=10)
        
        def call_next():
            if self.listbox_queue.size() > 0:
                nxt = self.listbox_queue.get(0)
                self.listbox_queue.delete(0)
                self.current_speaker.set(nxt)
                self.lbl_current_speaker.config(text=nxt)
                self.reset_timer()
                self.force_render()
            else:
                self.current_speaker.set("")
                self.lbl_current_speaker.config(text="- ว่าง -")
                self.force_render()
                
        tk.Button(right_f, text="🎙️ เรียกคิวถัดไปขึ้นจอ", command=call_next, bg="#f39c12", fg="white", font=("Tahoma", 12, "bold"), padx=10, pady=5).pack(pady=10)

    def set_system_status(self, is_open):
        self.is_system_open.set(is_open)
        if is_open:
            self.btn_sys_open.configure(bg="#27ae60", fg="white")
            self.btn_sys_close.configure(bg="#ecf0f1", fg="#7f8c8d")
        else:
            self.btn_sys_open.configure(bg="#ecf0f1", fg="#7f8c8d")
            self.btn_sys_close.configure(bg="#e74c3c", fg="white")
        self.force_render()

    def set_all_presence(self, status):
        if not self.is_system_open.get():
            messagebox.showwarning("ระบบถูกปิด", "ระบบถูกตั้งสถานะเป็น [ปิดระบบ] อยู่ กรุณากดเปิดระบบก่อนครับ")
            return
        for name in STUDENTS:
            self.attendance_status[name] = status
        self.refresh_grid_buttons()
        self.force_render()

    def handle_button_click(self, name):
        if not self.is_system_open.get():
            messagebox.showwarning("ระบบถูกปิด", "ระบบถูกตั้งสถานะเป็น [ปิดระบบ] อยู่ กรุณากดเปิดระบบก่อนครับ")
            return
        
        mode = self.control_mode.get()
        if mode == "QUORUM":
            # 3-Click Recheck Quorum Tracker
            self.student_click_counters[name] = self.student_click_counters.get(name, 0) + 1
            if self.student_click_counters[name] >= 3:
                self.student_click_counters[name] = 0
                self.recheck_quorum_counter += 1
                # Reset this student's attendance to trigger re-check
                self.attendance_status[name] = False
                messagebox.showinfo("ตรวจสอบองค์ประชุมใหม่", f"ตรวจพบการกดรายชื่อ 3 ครั้ง!\nระบบได้สั่งให้นักเรียน '{name}' แสดงตนใหม่อีกครั้งผ่านหน้าเว็บเรียบร้อยแล้ว")
            else:
                self.attendance_status[name] = not self.attendance_status[name]
        else:
            self.vote_status[name] = self.current_vote_tool.get()
        self.refresh_grid_buttons()
        self.force_render()

    def refresh_grid_buttons(self):
        mode = self.control_mode.get()
        for name, btn in self.buttons.items():
            if mode == "QUORUM":
                btn.configure(bg="#27ae60" if self.attendance_status[name] else COLOR_DEFAULT, fg="white")
            else:
                s = self.vote_status[name]
                cmap = {"APPROVE": COLOR_APPROVE, "DISAPPROVE": COLOR_DISAPPROVE, "ABSTAIN": "#FBC02D", "NOVOTE": COLOR_NOVOTE, "NONE": COLOR_DEFAULT}
                btn.configure(bg=cmap[s], fg="black" if s in ["APPROVE", "ABSTAIN"] else "white")

    def start_timer(self):
        try:
            m = self.timer_mins.get()
            s = self.timer_secs.get()
        except:
            m, s = 0, 0
            self.timer_mins.set(0)
            self.timer_secs.set(0)

        if self.timer_status.get() == "STOPPED":
            self.remaining_seconds = (m * 60) + s
            self.target_return_time = self.get_current_time() + datetime.timedelta(seconds=self.remaining_seconds)
        self.timer_status.set("RUNNING")
        self.update_timer_visuals()
        
    def pause_timer(self):
        if self.timer_status.get() == "RUNNING":
            self.timer_status.set("PAUSED")
            self.target_return_time = self.get_current_time() + datetime.timedelta(seconds=self.remaining_seconds)
        elif self.timer_status.get() == "PAUSED":
            self.timer_status.set("RUNNING")
            self.target_return_time = self.get_current_time() + datetime.timedelta(seconds=self.remaining_seconds)
        self.update_timer_visuals()
        
    def reset_timer(self):
        self.timer_status.set("STOPPED")
        try:
            m = self.timer_mins.get()
            s = self.timer_secs.get()
        except:
            m, s = 0, 0
        self.remaining_seconds = (m * 60) + s
        self.target_return_time = None
        self.update_timer_visuals()

    def adjust_timer(self, delta_secs):
        if self.timer_status.get() in ["RUNNING", "PAUSED"]:
            self.remaining_seconds += delta_secs
            if self.target_return_time:
                 self.target_return_time += datetime.timedelta(seconds=delta_secs)
            # Sync to UI Immediately
            if self.remaining_seconds >= 0:
                m, s = divmod(self.remaining_seconds, 60)
                self.timer_mins.set(m)
                self.timer_secs.set(s)
            else:
                m, s = divmod(abs(self.remaining_seconds), 60)
                self.timer_mins.set(-m if s==0 else -(m+1))
                self.timer_secs.set(s)
        else:
            try:
                current = (self.timer_mins.get() * 60) + self.timer_secs.get()
            except:
                current = 0
            new_val = max(0, current + delta_secs)
            self.timer_mins.set(new_val // 60)
            self.timer_secs.set(new_val % 60)
            self.remaining_seconds = new_val
        self.update_timer_visuals()

    def get_time_string(self, secs):
        is_negative = secs < 0
        m, s = divmod(abs(secs), 60)
        return f"{'-' if is_negative else ''}{m:02d}:{s:02d}"

    def start_main_clock_loop(self):
        if not self.clock_running:
            self.clock_running = True
            self.main_clock_tick()

    def main_clock_tick(self):
        now = self.get_current_time()
        
        if self.timer_status.get() == "RUNNING":
            self.remaining_seconds -= 1
            self.elapsed_seconds += 1
            
            # --- อัปเดตช่องตัวเลขบนหน้าจอแอดมินให้ลดลงตาม ---
            if self.remaining_seconds >= 0:
                m, s = divmod(self.remaining_seconds, 60)
                self.timer_mins.set(m)
                self.timer_secs.set(s)
            else:
                m, s = divmod(abs(self.remaining_seconds), 60)
                self.timer_mins.set(-m if s==0 else -(m+1))
                self.timer_secs.set(s)

        if self.display_window and tk.Toplevel.winfo_exists(self.display_window):
            if self.display_mode == "VOTE_RESULT_GOLD":
                self.display_canvas.itemconfig("txt_gold_clock", text=now.strftime("%H:%M:%S"))
                thai_year = now.year + 543
                date_str = f"วันที่  {now.day}  เดือน  {THAI_MONTHS[now.month]}  พ.ศ.  {thai_year}  เวลา  {now.strftime('%H:%M')}"
                self.display_canvas.itemconfig("txt_gold_date", text=date_str)
            else:
                self.display_canvas.itemconfig("txt_clock_time", text=now.strftime("%I:%M %p").lstrip("0"))
                self.display_canvas.itemconfig("txt_clock_date", text=now.strftime("%A, %B %d, %Y"))
            self.update_timer_visuals()

        self.root.after(1000, self.main_clock_tick)

    def open_display(self, mode):
        self.display_mode = mode
        if self.display_window is None or not tk.Toplevel.winfo_exists(self.display_window):
            self.display_window = tk.Toplevel(self.root)
            self.display_window.title("Parliament Display")
            self.display_window.attributes("-fullscreen", True)
            self.display_window.bind("<Escape>", lambda e: self.display_window.attributes("-fullscreen", False))
            self.sw = self.display_window.winfo_screenwidth()
            self.sh = self.display_window.winfo_screenheight()
            self.display_canvas = tk.Canvas(self.display_window, width=self.sw, height=self.sh, highlightthickness=0)
            self.display_canvas.pack(fill="both", expand=True)
            self.motion_text_display = None  # Reset widget reference on new window creation
            
        self.force_render()

    def force_render(self):
        if not self.display_window or not tk.Toplevel.winfo_exists(self.display_window): return
        self.display_canvas.delete("all")
        s = self.ui_scale.get()
        
        if self.motion_text_display:
            try:
                if self.motion_text_display.winfo_exists():
                    self.motion_text_display.place_forget()
                else:
                    self.motion_text_display = None
            except Exception:
                self.motion_text_display = None

        if self.display_mode == "VOTE_RESULT_GOLD":
            self.display_canvas.configure(bg="#e8e8e8")
        else:
            self.display_canvas.configure(bg="#2b2f2d")
            
        if self.display_mode != "VOTE_RESULT_GOLD":
            # Real Time Clock (Left) & Real Date (Right) — Exact BMA Parliament View
            now = self.get_current_time()
            self.display_canvas.create_text(48*s, 35*s, text=now.strftime("%I:%M %p").lstrip("0"), fill="#e0e0e0", font=(FONT_BODY, int(15*s)), anchor="w", tags="txt_clock_time")
            self.display_canvas.create_text(self.sw - (48*s), 35*s, text=now.strftime("%A, %B %d, %Y"), fill="#e0e0e0", font=(FONT_BODY, int(15*s)), anchor="e", tags="txt_clock_date")

        if self.display_mode not in ["SPEAKER", "BREAK", "ATTENDANCE_SUMMARY", "VOTE_RESULT_GOLD", "END_MEETING", "MOTION", "STANDBY"]:
            # Title in TH Sarabun New font
            self.display_canvas.create_text(48*s, 72*s, text=self.meeting_title.get(), fill="white", font=(FONT_TITLE, int(30*s), "bold"), anchor="w")

        if self.display_mode == "QUORUM": self.draw_grid_view("QUORUM", s)
        elif self.display_mode == "VOTE_GRID": self.draw_grid_view("VOTE", s)
        elif self.display_mode == "SEAT_MAP": self.draw_seat_map(s)
        elif self.display_mode == "SPEAKER": self.draw_speaker_view(s)
        elif self.display_mode == "BREAK": self.draw_break_view(s)
        elif self.display_mode == "ATTENDANCE_SUMMARY": self.draw_attendance_summary(s)
        elif self.display_mode == "VOTE_RESULT_GOLD": self.draw_vote_result_gold(s)
        elif self.display_mode == "END_MEETING": self.draw_end_meeting_view(s)
        elif self.display_mode == "MOTION": self.draw_motion_view(s)
        elif self.display_mode == "STANDBY": self.draw_standby_view(s)

        self.display_canvas.create_text(0, 0, text="", tags="txt_timer_overlay") 
        self.update_timer_visuals()

    def update_timer_visuals(self):
        if not self.display_window or not tk.Toplevel.winfo_exists(self.display_window): return
        s = self.ui_scale.get()
        status = self.timer_status.get()
        secs = self.remaining_seconds if status != "STOPPED" else ((self.timer_mins.get()*60)+self.timer_secs.get())
        time_str = self.get_time_string(secs)
        is_neg = secs < 0
        
        if self.display_mode == "BREAK":
            color = "#FF5252" if is_neg else ("#FFEB3B" if status == "PAUSED" else "white")
            self.display_canvas.itemconfig("txt_break_timer", text=time_str, fill=color)
            self.display_canvas.itemconfig("txt_break_paused", text="(Paused)" if status == "PAUSED" else "", fill="#FFEB3B")

        elif self.display_mode == "SPEAKER":
            color = "#FF5252" if is_neg else ("#FFEB3B" if status == "PAUSED" else "#00E676")
            self.display_canvas.itemconfig("txt_speaker_timer", text=time_str, fill=color)

        elif self.display_mode not in ["QUORUM", "VOTE_GRID", "VOTE_RESULT_GOLD", "ATTENDANCE_SUMMARY", "END_MEETING", "MOTION", "STANDBY"]: 
            if status != "STOPPED":
                txt = f"Timer: {time_str} {'(Paused)' if status == 'PAUSED' else ''}"
                color = "#FF5252" if is_neg else ("#FFEB3B" if status == "PAUSED" else "white")
                self.display_canvas.coords("txt_timer_overlay", self.sw/2, self.sh - (50*s))
                self.display_canvas.itemconfig("txt_timer_overlay", text=txt, fill=color, font=(FONT_BODY, int(20*s), "bold"))
            else:
                self.display_canvas.itemconfig("txt_timer_overlay", text="")

    # --- Draw Screens ---
    
    def draw_standby_view(self, s):
        self.display_canvas.create_text(self.sw/2, self.sh/2 - (100*s), text="รายการต่อไป / NEXT PROGRAM", fill="#f39c12", font=(FONT_TITLE, int(42*s), "bold"), tags="content")
        b_text = self.broadcast_text.get() if self.broadcast_text.get() else "- กรุณาใส่ข้อความรอถ่ายทอดสด -"
        self.display_canvas.create_text(self.sw/2, self.sh/2, text=b_text, fill="white", font=(FONT_TITLE, int(54*s), "bold"), justify="center", width=self.sw*0.9, tags="content")

    def draw_motion_view(self, s):
        self.display_canvas.create_text(self.sw/2, 110*s, text=self.meeting_title.get(), fill="white", font=(FONT_TITLE, int(32*s), "bold"))
        self.display_canvas.create_text(48*s, 160*s, text="ร่างข้อบัญญัติ / ร่างมติที่พิจารณา:", fill="#94a3b8", font=(FONT_BODY, int(13*s)), anchor="w")
        
        # Check if motion_text_display exists and belongs to current display_window
        needs_create = True
        if self.motion_text_display:
            try:
                if self.motion_text_display.winfo_exists() and self.motion_text_display.master == self.display_window:
                    needs_create = False
                else:
                    self.motion_text_display.destroy()
            except Exception:
                pass

        if needs_create:
            self.motion_text_display = tk.Text(self.display_window, bg="#1e2321", fg="white", font=(FONT_TITLE, int(34*s)), wrap="word", bd=1, highlightthickness=0, padx=40, pady=40)
            self.motion_text_display.tag_configure("strike_red", overstrike=True, foreground="#FF5252")
            self.motion_text_display.tag_configure("highlight", background="#FFEB3B", foreground="black")

        self.motion_text_display.place(relx=0.04, rely=0.22, relwidth=0.92, relheight=0.68)
        self.sync_motion_text()

    def draw_vote_result_gold(self, s):
        self.display_canvas.create_rectangle(0, 30*s, self.sw, 120*s, fill="#b5874c", outline="")
        self.display_canvas.create_text(self.sw/2, 75*s, text="ผลการลงคะแนนเสียง", fill="white", font=(FONT_TITLE, int(48*s), "bold"))
        
        thai_year = self.get_current_time().year + 543
        date_str = f"วันที่  {self.get_current_time().day}  เดือน  {THAI_MONTHS[self.get_current_time().month]}  พ.ศ.  {thai_year}  เวลา  {self.get_current_time().strftime('%H:%M')}"
        self.display_canvas.create_text(self.sw/2, 160*s, text=date_str, fill="#9c7344", font=(FONT_BODY, int(22*s), "bold"), tags="txt_gold_date") 
        
        self.display_canvas.create_text(self.sw - 100*s, 140*s, text="", fill="#333333", font=(FONT_BODY, int(22*s), "bold"), tags="txt_gold_clock")

        app = sum(1 for v in self.vote_status.values() if v == "APPROVE")
        dis = sum(1 for v in self.vote_status.values() if v == "DISAPPROVE")
        abs_v = sum(1 for v in self.vote_status.values() if v == "ABSTAIN")
        no_v = sum(1 for v in self.vote_status.values() if v == "NOVOTE")
        total_v = app + dis + abs_v + no_v 

        labels = ["จำนวนผู้ลงมติ", "เห็นชอบ", "ไม่เห็นชอบ", "งดออกเสียง", "ไม่ลงคะแนนเสียง"]
        values = [total_v, app, dis, abs_v, no_v]

        start_y = 250 * s
        gap_y = 110 * s
        center_x = self.sw / 2
        box_width = 280 * s
        box_height = 85 * s

        for i in range(5):
            y = start_y + (i * gap_y)
            self.display_canvas.create_text(center_x - (50*s), y, text=labels[i], fill="#9c7344", font=(FONT_TITLE, int(46*s), "bold"), anchor="e")

            box_x1 = center_x + (50*s)
            box_y1 = y - (box_height / 2)
            box_x2 = box_x1 + box_width
            box_y2 = box_y1 + box_height

            self.display_canvas.create_rectangle(box_x1, box_y1, box_x2, box_y2, fill="#e3cba8", outline="")
            self.display_canvas.create_text((box_x1 + box_x2) / 2, y, text=str(values[i]), fill="black", font=(FONT_BODY, int(54*s), "bold"), anchor="center")

    def draw_end_meeting_view(self, s):
        self.display_canvas.create_text(self.sw/2, self.sh/2 - (50*s), text="ปิดการประชุม", fill="#FF5252", font=(FONT_TITLE, int(130*s), "bold"))
        self.display_canvas.create_text(self.sw/2, self.sh/2 + (80*s), text="Meeting Adjourned", fill="#a0afaa", font=(FONT_BODY, int(36*s)))

    def draw_attendance_summary(self, s):
        self.display_canvas.create_text(self.sw/2, 130*s, text=self.meeting_title.get(), fill="white", font=(FONT_TITLE, int(32*s), "bold"))
        self.display_canvas.create_text(self.sw/2, 210*s, text="สรุปจำนวนผู้เข้าร่วมประชุม", fill="#00BCD4", font=(FONT_BODY, int(42*s), "bold"))
        present_count = sum(self.attendance_status.values())
        total_count = int(self.total_participants.get()) if self.total_participants.get().isdigit() else len(STUDENTS)
        bx_w = 800 * s; bx_h = 220 * s; cx = self.sw / 2; cy = 450 * s
        self.display_canvas.create_rectangle(cx - bx_w/2, cy - bx_h/2, cx + bx_w/2, cy + bx_h/2, fill="#373e3b", outline="#00E676", width=3)
        self.display_canvas.create_text(cx, cy - (30*s), text="มาประชุม (ยืนยันตัวตนแล้ว)", fill="white", font=(FONT_BODY, int(28*s)))
        self.display_canvas.create_text(cx, cy + (50*s), text=f"{present_count} / {total_count} คน", fill="#00E676", font=(FONT_BODY, int(64*s), "bold"))
        pct = (present_count / total_count) * 100 if total_count > 0 else 0
        self.display_canvas.create_text(cx, cy + (140*s), text=f"คิดเป็น {pct:.2f}% ของผู้มีสิทธิทั้งหมด", fill="#94a3b8", font=(FONT_BODY, int(18*s)))

    def draw_break_view(self, s):
        self.display_canvas.create_text(self.sw/2, 280*s, text="☕ พักการประชุม", fill="white", font=(FONT_TITLE, int(120*s), "bold"), tags="content")
        if self.timer_status.get() != "STOPPED" and self.target_return_time:
            ret_str = self.target_return_time.strftime('%H:%M น.')
            self.display_canvas.create_text(self.sw/2, 470*s, text=f"เวลากลับมาประชุม: {ret_str}", fill="#FFEB3B", font=(FONT_BODY, int(36*s), "bold"), tags="content")
        self.display_canvas.create_text(self.sw/2, 650*s, text="", font=(FONT_BODY, int(110*s), "bold"), tags="txt_break_timer")
        self.display_canvas.create_text(self.sw/2, 800*s, text="", font=(FONT_BODY, int(30*s), "bold"), tags="txt_break_paused")

    def draw_speaker_view(self, s):
        self.display_canvas.create_text(self.sw/2, 180*s, text="🎙️ กำลังอภิปราย", fill="#f59e0b", font=(FONT_BODY, int(32*s), "bold"))
        spk = self.current_speaker.get() if self.current_speaker.get() else "- ยังไม่มีผู้อภิปราย -"
        self.display_canvas.create_text(self.sw/2, 320*s, text=spk, fill="white", font=(FONT_TITLE, int(58*s), "bold"))
        self.display_canvas.create_text(self.sw/2, 570*s, text="", font=(FONT_BODY, int(120*s), "bold"), tags="txt_speaker_timer")

    def draw_grid_view(self, mode, s):
        rows_per_col = 18
        col_w = (self.sw - 120*s) / 3
        row_h = 24 * s
        start_x = 48 * s
        
        # Section subhead
        self.display_canvas.create_text(48*s, 115*s, text="Vote result", fill="#94a3b8", font=(FONT_BODY, int(11*s)), anchor="w")
        self.display_canvas.create_text(48*s, 220*s, text="Individual Results", fill="#94a3b8", font=(FONT_BODY, int(11*s)), anchor="w")

        # Summary Box
        self.draw_bma_summary_box(mode, s)

        # 3 Columns grid of 52 students
        start_y = 240 * s
        cmap = {"APPROVE": "#00E676", "DISAPPROVE": "#FF5252", "ABSTAIN": "#FFEB3B", "NOVOTE": "#9C27B0", "NONE": "#475569"}

        for i, name in enumerate(STUDENTS):
            col_idx = i // rows_per_col
            row_idx = i % rows_per_col
            x = start_x + (col_idx * (col_w + 14*s))
            y = start_y + (row_idx * (row_h + 4*s))

            # Row Pill Background
            self.display_canvas.create_rectangle(x, y, x + col_w, y + row_h, fill="#373e3b", outline="#444d49")

            # Indicator Dot/Pill
            if mode == "QUORUM":
                ind_color = "#00E676" if self.attendance_status[name] else "#475569"
            else:
                ind_color = cmap.get(self.vote_status[name], "#475569")

            self.display_canvas.create_rectangle(x + (8*s), y + (4*s), x + (13*s), y + row_h - (4*s), fill=ind_color, outline="")
            self.display_canvas.create_text(x + (22*s), y + (row_h/2), text=name, fill="white", font=(FONT_BODY, int(10*s)), anchor="w")

        # Footers (Elapsed Time or Passed badge)
        if mode == "QUORUM":
            el_m, el_s = divmod(self.elapsed_seconds, 60)
            elapsed_str = f"Elapsed time  {el_m:02d}:{el_s:02d}"
            self.display_canvas.create_text(self.sw/2, self.sh - (30*s), text=elapsed_str, fill="#94a3b8", font=(FONT_BODY, int(11*s)), anchor="center")
        else:
            present_c = sum(self.attendance_status.values())
            app_c = sum(1 for v in self.vote_status.values() if v == "APPROVE")
            is_passed = app_c >= (present_c / 2) if present_c > 0 else False
            bg_badge = "#22c55e" if is_passed else "#ef4444"
            txt_badge = "Passed" if is_passed else "Not Passed"
            
            bw = 140 * s; bh = 30 * s
            cx = self.sw / 2; cy = self.sh - (35*s)
            self.display_canvas.create_rectangle(cx - bw/2, cy - bh/2, cx + bw/2, cy + bh/2, fill=bg_badge, outline="")
            self.display_canvas.create_text(cx, cy, text=txt_badge, fill="white", font=(FONT_BODY, int(13*s), "bold"), anchor="center")

    def draw_bma_summary_box(self, mode, s):
        center_x = self.sw * 0.45
        start_y = 100 * s
        box_w = 260 * s
        
        present_count = sum(self.attendance_status.values())
        app = sum(1 for v in self.vote_status.values() if v == "APPROVE")
        dis = sum(1 for v in self.vote_status.values() if v == "DISAPPROVE")
        abs_v = sum(1 for v in self.vote_status.values() if v == "ABSTAIN")
        no_v = sum(1 for v in self.vote_status.values() if v == "NOVOTE")
        total_voters = app + dis + abs_v + no_v

        if mode == "QUORUM":
            items = [
                ("#00E676", "ยืนยันตัวตน", present_count),
                ("#9C27B0", "จำนวนผู้เข้าร่วมประชุม", present_count if self.is_system_open.get() else 0)
            ]
        else:
            items = [
                ("#00E676", "เห็นชอบ", app),
                ("#FF5252", "ไม่เห็นชอบ", dis),
                ("#FFEB3B", "งดออกเสียง", abs_v),
                ("#9C27B0", "ไม่ลงคะแนนเสียง", no_v),
                ("#00BCD4", "จำนวนผู้ลงคะแนน", total_voters),
                ("#2196F3", "จำนวนผู้เข้าร่วมประชุม", present_count)
            ]

        row_h = 18 * s
        box_h = (len(items) * row_h) + (10 * s)
        box_x = center_x - (box_w / 2)

        self.display_canvas.create_rectangle(box_x, start_y, box_x + box_w, start_y + box_h, fill="#373e3b", outline="#444d49")

        for i, (col, lbl, val) in enumerate(items):
            y = start_y + (i * row_h) + (10 * s)
            self.display_canvas.create_oval(box_x + (10*s), y - (4*s), box_x + (18*s), y + (4*s), fill=col, outline="")
            self.display_canvas.create_text(box_x + (26*s), y, text=lbl, fill="white", font=(FONT_BODY, int(9.5*s)), anchor="w")
            
            badge_w = 40 * s
            bx = box_x + box_w - badge_w - (8*s)
            self.display_canvas.create_rectangle(bx, y - (7*s), bx + badge_w, y + (7*s), fill="#444d49", outline="")
            self.display_canvas.create_text(bx + (badge_w/2), y, text=str(val), fill="white", font=(FONT_BODY, int(10*s), "bold"), anchor="center")

    def draw_seat_map(self, s):
        self.display_canvas.create_text(self.sw/2, 120*s, text="แผนผังที่นั่งในห้องประชุมสภา (Seat Map)", fill="#a0afaa", font=(FONT_TITLE, int(26*s), "bold"))
        block_w = 90 * s; block_h = 45 * s; cx = self.sw / 2; front_y = 180 * s
        self.display_canvas.create_rectangle(cx - (block_w*3), front_y, cx - (block_w*2), front_y + block_h, fill="#8e44ad", outline="white", width=2)
        self.display_canvas.create_text(cx - (block_w*2.5), front_y + (block_h/2), text="รองฯ ๑", fill="white", font=(FONT_BODY, int(12*s), "bold"))
        self.display_canvas.create_rectangle(cx - (block_w/2), front_y, cx + (block_w/2), front_y + block_h, fill="#2980b9", outline="white", width=2)
        self.display_canvas.create_text(cx, front_y + (block_h/2), text="ประธาน", fill="white", font=(FONT_BODY, int(12*s), "bold"))
        self.display_canvas.create_rectangle(cx + (block_w*2), front_y, cx + (block_w*3), front_y + block_h, fill="#8e44ad", outline="white", width=2)
        self.display_canvas.create_text(cx + (block_w*2.5), front_y + (block_h/2), text="รองฯ ๒", fill="white", font=(FONT_BODY, int(12*s), "bold"))
        gap = 10 * s; cols = 13; rows = 4; start_x = (self.sw / 2) - (((cols * block_w) + ((cols-1) * gap)) / 2); start_y = 300 * s 
        cmap = {"APPROVE": COLOR_APPROVE, "DISAPPROVE": COLOR_DISAPPROVE, "ABSTAIN": COLOR_ABSTAIN, "NOVOTE": COLOR_NOVOTE, "NONE": "#373e3b"}
        for i, name in enumerate(STUDENTS):
            if i >= cols * rows: break
            col = i % cols; row = i // cols
            x = start_x + (col * (block_w + gap)); y = start_y + (row * (block_h + gap))
            y += abs(col - (cols//2)) * (12*s)
            color = cmap[self.vote_status[name]] if self.control_mode.get() == "VOTE" else (COLOR_APPROVE if self.attendance_status[name] else "#373e3b")
            self.display_canvas.create_rectangle(x, y, x+block_w, y+block_h, fill=color, outline="#444d49")
            self.display_canvas.create_text(x+(block_w/2), y+(block_h/2), text=name.split(" ")[0], fill="white" if color != COLOR_ABSTAIN else "black", font=(FONT_BODY, int(11*s), "bold"))

    def generate_html_report(self):
        file_path = filedialog.asksaveasfilename(defaultextension=".html", initialfile=f"Meeting_Report_{datetime.datetime.now().strftime('%Y%m%d')}.html", filetypes=[("HTML files", "*.html")])
        if not file_path: return
        present = sum(self.attendance_status.values())
        app_v = sum(1 for v in self.vote_status.values() if v == "APPROVE")
        dis = sum(1 for v in self.vote_status.values() if v == "DISAPPROVE")
        abs_vote = sum(1 for v in self.vote_status.values() if v == "ABSTAIN")
        
        html = f"""
        <html>
        <head>
            <meta charset="utf-8">
            <title>รายงานการประชุมสภา</title>
            <style>
                body {{ font-family: 'Tahoma', sans-serif; margin: 40px; color: #333; }}
                h1 {{ text-align: center; color: #2E7D32; }}
                .summary {{ background: #f4f4f4; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }}
                th {{ background-color: #2E7D32; color: white; }}
                .app {{ color: green; font-weight: bold; }}
                .dis {{ color: red; font-weight: bold; }}
            </style>
        </head>
        <body>
            <h1>รายงานสรุปการประชุม</h1>
            <div class="summary">
                <p><strong>หัวข้อ/วาระปัจจุบัน:</strong> {self.meeting_title.get()}</p>
                <p><strong>วันที่ออกรายงาน:</strong> {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
                <hr>
                <h3>สรุปยอด</h3>
                <p>จำนวนผู้เข้าร่วมประชุม: {present} / {self.total_participants.get()} คน</p>
                <p>ผลการลงมติ: เห็นด้วย <span class="app">{app_v}</span> | ไม่เห็นด้วย <span class="dis">{dis}</span> | งดออกเสียง {abs_vote}</p>
            </div>
            <table>
                <tr><th>ลำดับ/รหัส</th><th>ชื่อ-นามสกุล</th><th>องค์ประชุม</th><th>การลงมติ</th></tr>
        """
        status_th = {"APPROVE": "<span class='app'>เห็นด้วย</span>", "DISAPPROVE": "<span class='dis'>ไม่เห็นด้วย</span>", "ABSTAIN": "งดออกเสียง", "NOVOTE": "ไม่ลงคะแนน", "NONE": "-"}
        for name in STUDENTS:
            p1, p2 = name.split(" ", 1) if " " in name else (name, "")
            q_txt = "มา" if self.attendance_status[name] else "<span style='color:red'>ขาด</span>"
            v_txt = status_th[self.vote_status[name]]
            html += f"<tr><td>{p1}</td><td>{p2}</td><td>{q_txt}</td><td>{v_txt}</td></tr>"
        html += "</table></body></html>"
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f: f.write(html)
            messagebox.showinfo("สำเร็จ", "สร้างรายงานเสร็จสิ้น! ไฟล์พร้อม Print เป็น PDF แล้ว")
            os.startfile(file_path)
        except Exception as e:
            messagebox.showerror("Error", str(e))

if __name__ == "__main__":
    root = tk.Tk()
    app = SmartParliamentSystem(root)
    root.mainloop()