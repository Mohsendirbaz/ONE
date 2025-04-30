# Branch Documentation

## Current Branch Structure

The project is currently using the following branch structure:

- **Main Branch**: `main`
- **Remote Tracking**:
  - This branch is tracked by two remote repositories:
    - `origin` (now pointing to ONE1 repository)
    - `ONE` (new independent repository)

## Branch Independence

The `main` branch has been set up to be independent from the original codebase. This means:

1. The branch has its own commit history
2. Changes made to this branch will not affect the original codebase
3. The branch can be developed independently

## Remote Repository Tracking

The `main` branch is currently tracking:
- `ONE/main` - This is the primary remote tracking relationship for future development
- `origin/main` - This is the original repository that the code was forked from

## Working with the Branch

### Checking Branch Status

To check which branch you're on and its tracking relationships:

```bash
git branch -vv
```

### Pushing Changes

When pushing changes, make sure to push to the ONE remote:

```bash
git push ONE main
```

### Pulling Changes

When pulling changes, specify the ONE remote:

```bash
git pull ONE main
```

## Package.json Repository References

The package.json file has been updated to remove references to the original repositories (SF and codebase). The repository URLs now point to the ONE1 repository:

```
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Mohsendirbaz/ONE1.git"
  },
  "bugs": {
    "url": "https://github.com/Mohsendirbaz/ONE1/issues"
  }
}
```

## Important Notes

- Always verify which remote you're pushing to or pulling from
- The branch structure allows for independent development without affecting the original codebase
- Future development should focus on the `main` branch tracked by the `ONE` remote
