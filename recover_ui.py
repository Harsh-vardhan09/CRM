import json
import os

transcript_path = r"C:\Users\varun\.gemini\antigravity-ide\brain\6a7d034c-df5f-4dea-9412-07ea67196f30\.system_generated\logs\transcript_full.jsonl"

targets = [
    r"c:\CRM\CRM\apps\web\app\user\page.tsx",
    r"c:\CRM\CRM\apps\web\app\admin\page.tsx",
    r"c:\CRM\CRM\apps\web\app\admin\join-requests\page.tsx",
    r"c:\CRM\CRM\apps\web\app\login\page.tsx",
    r"c:\CRM\CRM\apps\web\app\signup\page.tsx",
    r"c:\CRM\CRM\apps\docs\app\layout.tsx",
    r"c:\CRM\CRM\apps\docs\app\page.tsx"
]

# Load current disk contents
files = {}
for t in targets:
    try:
        with open(t, 'r', encoding='utf-8') as f:
            files[t.replace('\\', '/').lower()] = {"path": t, "content": f.read()}
    except Exception as e:
        pass

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            if 'tool_calls' in step:
                for call in step['tool_calls']:
                    name = call.get('name')
                    args = call.get('args', {})
                    target_arg = args.get('TargetFile', '').replace('\\', '/').lower()
                    
                    # If this file is in our targets
                    if target_arg in files:
                        if name in ['write_to_file', 'default_api:write_to_file']:
                            files[target_arg]['content'] = args.get('CodeContent', '')
                        elif name in ['replace_file_content', 'multi_replace_file_content', 'default_api:replace_file_content', 'default_api:multi_replace_file_content']:
                            content = files[target_arg]['content']
                            chunks = args.get('ReplacementChunks', []) if 'multi' in name else [args]
                            for chunk in chunks:
                                target_str = chunk.get('TargetContent', '')
                                repl_str = chunk.get('ReplacementContent', '')
                                content = content.replace(target_str, repl_str)
                            files[target_arg]['content'] = content
        except Exception as e:
            pass

# Write out the recovered files
for key, data in files.items():
    print(f"Recovered: {data['path']}")
    with open(data['path'], 'w', encoding='utf-8') as f:
        f.write(data['content'])

print("Done")
