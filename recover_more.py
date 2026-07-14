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
                    if name in ['write_to_file', 'default_api:write_to_file']:
                        target = args.get('TargetFile', '').replace('\\', '/')
                        if 'apps/web/app/' in target:
                            files[target] = args.get('CodeContent', '')
                    elif name in ['replace_file_content', 'multi_replace_file_content', 'default_api:replace_file_content', 'default_api:multi_replace_file_content']:
                        target = args.get('TargetFile', '').replace('\\', '/')
                        if 'apps/web/app/' in target:
                            if target in files:
                                content = files[target]
                                chunks = args.get('ReplacementChunks', []) if 'multi' in name else [args]
                                for chunk in chunks:
                                    target_str = chunk.get('TargetContent', '')
                                    repl_str = chunk.get('ReplacementContent', '')
                                    content = content.replace(target_str, repl_str)
                                files[target] = content
        except Exception as e:
            pass

# Write out the recovered files
for key, content in files.items():
    print(f"Recovered: {key}")
    # key is like c:/CRM/CRM/apps/web/app/user/page.tsx
    out_path = key.replace('/', os.sep)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
