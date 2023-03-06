#!/usr/bin/env python3

results = []

for line in open("dict-raw.txt"):
    if len(line.strip()) == 0:
        continue

    parts = line.strip().split(" ")

    count = 1
    if parts[-1].replace(",", "").isnumeric():
        count = int(parts[-1].replace(",", ""))
        parts = parts[:-1]

    name = (
        " ".join(parts)
        .replace("(", "")
        .replace(")", "")
        .replace(" ·", "")
        .replace("–", "-")
        .replace("CaraFa", "Carafa")
    )
    if len(name) > 3:
        # Deflate uses 3 bytes for replacement, so it's only worth it if the
        # thing to replace is longer.
        results.append((name, count))

# Remove duplicates with an ordered set.
results = list(dict.fromkeys(results))

# Sort by the count, then by the name.
results.sort(key=lambda x: f"{x[1]:6d}{x[0]}")

for name, count in results:
    print(name, end=" ")
