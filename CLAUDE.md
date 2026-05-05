# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- Expo SDK (latest), TypeScript, expo-router
- 알림: expo-notifications
- 저장: AsyncStorage (단순) 또는 SQLite

## Design Tokens

| 항목 | 값 |
|---|---|
| 배경 | `#0A0A0F` |
| 카드 | `#16161E` |
| 인디고 (주조색) | `#6C63FF` |
| 강조 빨강 | D-DAY |
| 강조 앰버 | D-N |
| 강조 그린 | 완료 |
| 폰트 제목 | SF Pro Display |
| 폰트 본문 | SF Pro Text |
| 라디우스 카드 | 20 |
| 라디우스 칩 | 14 |
| 라디우스 모달 | 28 |

**효과:** 글래스모피즘 버튼, 카드 인셋 보더, 인디고 글로우 그림자

## Screens

- **Home** — 리마인더 카드 리스트, D-DAY 강조 표시
- **Add Reminder** — 슬라이드업 모달, 휠 피커, 7옵션 사전알림
- **Ringtone Picker** — STANDARD/CLASSIC 그룹, 행별 재생
