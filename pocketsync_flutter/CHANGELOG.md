## 0.0.5
### New Features
- Add `silent` option to `PocketSyncOptions` to disable sync logs

### Breaking Changes
- Renamed `startSync` method to `start`
- Renamed `pauseSync` method to `pause`
- Removed `resumeSync` method (use `start` method instead)

### Performance Improvements
- Implemented batch processing for database operations
- Moved changes processing to a separate isolate for better performance
- Optimized sync queue management
- Enhanced conflict resolution handling

## 0.0.4
- Optimize table extraction algo for watching queries
- Fix: Sometimes, remote changes application caused database locks, it's now fixed
- Fix: Watching queries was not working as expected.

## 0.0.3
- Support watching sql statements
- Fix bug where engine was looking for remote changing despite sync not being enabled

## 0.0.2

- Added dartdoc
- Cleaned up code

## 0.0.1

- Initial release.
