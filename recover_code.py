import json
import os

transcript_path = r"C:\Users\varun\.gemini\antigravity-ide\brain\6a7d034c-df5f-4dea-9412-07ea67196f30\.system_generated\logs\transcript_full.jsonl"

files = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            if 'tool_calls' in step:
                for call in step['tool_calls']:
                    name = call.get('name')
                    args = call.get('args', {})
                    if name == 'write_to_file':
                        target = args.get('TargetFile', '')
                        if 'apps\\server\\src\\controllers\\' in target or 'apps/server/src/controllers/' in target.replace('\\', '/'):
                            normalized = os.path.basename(target.replace('\\', '/'))
                            files[normalized] = args.get('CodeContent', '')
                    elif name in ['replace_file_content', 'multi_replace_file_content']:
                        target = args.get('TargetFile', '')
                        if 'apps\\server\\src\\controllers\\' in target or 'apps/server/src/controllers/' in target.replace('\\', '/'):
                            normalized = os.path.basename(target.replace('\\', '/'))
                            if normalized in files:
                                content = files[normalized]
                                chunks = args.get('ReplacementChunks', []) if name == 'multi_replace_file_content' else [args]
                                
                                for chunk in chunks:
                                    target_str = chunk.get('TargetContent', '')
                                    repl_str = chunk.get('ReplacementContent', '')
                                    content = content.replace(target_str, repl_str)
                                files[normalized] = content
        except Exception as e:
            pass

# Write out the recovered files
for filename, content in files.items():
    print(f"Recovered: {filename}")
    out_path = os.path.join(r"c:\CRM\CRM\apps\server\src\controllers", filename)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
