import os

def main():
    env_file = '.env'
    config_file = 'config.js'

    if not os.path.exists(env_file):
        print(f"Error: {env_file} not found.")
        print("Please create a .env file and add your GEMINI_API_KEY")
        return

    api_key = None
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('GEMINI_API_KEY'):
                # Split on first equal sign
                parts = line.split('=', 1)
                if len(parts) == 2:
                    api_key = parts[1].strip().strip('"').strip("'")
                    break
    
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env")
        return

    # Write config.js
    with open(config_file, 'w') as f:
        f.write(f'const GEMINI_API_KEY = "{api_key}";\n')
    
    print(f"Successfully created {config_file}")

if __name__ == '__main__':
    main()
