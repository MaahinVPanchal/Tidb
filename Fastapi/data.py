import os
import requests
import subprocess
import uuid
import time
import argparse
from typing import List, Dict

from app.services.dataembedgit_service import embed_repo

API_URL = "https://api.github.com/orgs/OCA/repos?per_page=100"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def ensure_data_dir() -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    return DATA_DIR


def fetch_oca_repos() -> List[Dict]:
    repos: List[Dict] = []
    page = 1
    token = os.getenv("GITHUB_TOKEN", "").strip()
    base_headers = {"User-Agent": "Mozilla/5.0"}

    if token:
        base_headers["Authorization"] = f"Bearer {token}"

    while True:
        url = f"{API_URL}&page={page}"
        attempts = 0
        max_attempts = 5
        last_exc = None

        while attempts < max_attempts:
            try:
                response = requests.get(url, headers=base_headers, timeout=30)
                if response.status_code == 200:
                    break
                else:
                    print(f"Failed to fetch page {page}, status: {response.status_code}, retrying...")
            except requests.exceptions.RequestException as e:
                last_exc = e
                print(f"Request error on page {page}: {e}, retrying...")

            attempts += 1
            time.sleep(2 ** attempts)

        if attempts == max_attempts and (last_exc or response.status_code != 200):
            print(f"Giving up on page {page} after {max_attempts} attempts.")
            break

        data = response.json()
        if not data:
            break

        repos.extend(data)
        page += 1

    return repos


def clone_repo(clone_url: str, dest_root: str) -> str:
    repo_name = clone_url.rstrip("/").split("/")[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]
    target_dir = os.path.join(dest_root, repo_name)
    if os.path.exists(target_dir):
        print(f"Already exists, skipping clone: {repo_name}")
        return target_dir

    print(f"Cloning {clone_url} -> {target_dir} ...")
    result = subprocess.run(["git", "clone", "--depth", "1", clone_url, target_dir])
    if result.returncode == 0:
        print("Done.")
        return target_dir
    else:
        print("Failed to clone:", clone_url)
        return ""


def main():
    parser = argparse.ArgumentParser(description="Clone OCA repos and embed code to TiDB")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of repos to process (0 = no limit)")
    args = parser.parse_args()

    ensure_data_dir()
    batch_uuid = str(uuid.uuid4())
    print(f"Batch UUID: {batch_uuid}")

    repos = fetch_oca_repos()
    print(f"Total repos found: {len(repos)}")

    if args.limit and args.limit > 0:
        repos = repos[: args.limit]
        print(f"Processing first {len(repos)} repos due to --limit")

    for repo in repos:
        clone_url = repo.get("clone_url")
        name = repo.get("name") or "unknown"
        if not clone_url:
            continue

        repo_path = clone_repo(clone_url, DATA_DIR)
        if not repo_path:
            continue

        repo_uuid = str(uuid.uuid4())
        files_processed, chunks_inserted = embed_repo(
            repo_path=repo_path,
            repo_name=name,
            batch_uuid=batch_uuid,
            repo_uuid=repo_uuid,
            clone_url=clone_url,
        )

        print(f"Embedded repo {name} (uuid={repo_uuid}): files={files_processed}, chunks={chunks_inserted}")


if __name__ == "__main__":
    main()