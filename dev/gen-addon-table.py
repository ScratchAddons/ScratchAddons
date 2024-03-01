import os
import json
import time

# Change to the addons directory
file_path = os.path.abspath(__file__)
root_dir = os.path.dirname(os.path.dirname(file_path))
addons_dir = os.path.join(root_dir, "addons")
os.chdir(addons_dir)
print(f"Finding addon IDs and names in {addons_dir}...")

# Get all addon IDs
addons = []
with open("addons.json", "rt") as f:
  addons = json.loads(f.read())

# Exclude comments
addons = [i for i in addons if i[:2] != "//"]

# Get all addon names and build the table
table_cnts = []
print(f"Reading {len(addons)} addon manifests...")
for id in addons:
  with open(f"{id}/addon.json", "rt") as f:
    name = json.loads(f.read())["name"]
    table_cnts.append(f"| {name} | [{id}](/addons/{id}) |")

table_cnts.sort(key=lambda s: s.lower())

# Turn it all into a Markdown document
print("Generating README.md...")
nlsval = "\n".join(table_cnts)
contents = f"""# Addons By Name

| Addon Name | Addon ID |
|---|---|
{nlsval}

Adding something new? Run [gen-addon-table.py](/dev/gen-addon-table.py) to regenerate this list.
"""

with open("README.md", "w", encoding="utf-8") as f:
  f.write(contents)

print("All done!")
time.sleep(0.75)
