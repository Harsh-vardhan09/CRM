import glob
import json
import os

pattern = r"C:\Users\varun\.gemini\antigravity-ide\brain\*\.system_generated\logs\transcript_full.jsonl"
for transcript_path in glob.glob(pattern):
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    step = json.loads(line)
                    if 'tool_calls' in step:
                        for call in step['tool_calls']:
                            name = call.get('name')
                            args = call.get('args', {})
                            if name in ['write_to_file', 'replace_file_content', 'multi_replace_file_content', 'default_api:write_to_file', 'default_api:replace_file_content', 'default_api:multi_replace_file_content']:
                                target = args.get('TargetFile', '').replace('\\', '/')
                                if 'apps/web/app/user/page.tsx' in target:
                                    print(f"Found in: {transcript_path}")
                                    break
                except:
                    pass
    except:
        pass
