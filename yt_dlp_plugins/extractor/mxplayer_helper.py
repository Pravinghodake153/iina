"""
MX Player & Custom Streaming Helper Extractor for yt-dlp & IINA
----------------------------------------------------------------
This extractor demonstrates how yt-dlp interacts with video streaming platforms
like MX Player (mxplayer.in) and other HLS (.m3u8) / DASH (.mpd) stream providers.

How It Works:
1. URL Matching: Detects supported stream URLs via regular expression.
2. Metadata Extraction: Downloads the webpage HTML/JSON state safely.
3. Header Injection: Passes custom Referer, Origin, and User-Agent headers
   to the player engine so the media server does not return HTTP 403 Forbidden.
4. Format Resolution: Discovers and parses .m3u8 manifests to supply video
   and audio quality options to IINA.
"""

from yt_dlp.extractor.common import InfoExtractor
from yt_dlp.utils import (
    ExtractorError,
    clean_html,
    determine_ext,
    int_or_none,
    url_or_none,
)


class MXPlayerHelperIE(InfoExtractor):
    """
    Extractor helper for MX Player web stream URLs and custom HLS manifests.
    Inherits from InfoExtractor, the core class used by yt-dlp to scrape media links.
    """

    IE_NAME = 'mxplayer:helper'
    IE_DESC = 'MX Player & HLS Stream Helper for IINA'

    # URL pattern matching MX Player movie, episode, and short URLs
    _VALID_URL = r'''(?x)
        https?://(?:www\.)?mxplayer\.in/
        (?:
            movie/[^/?#]+-(?P<movie_id>[0-9a-f]{32}) |
            show/[^/?#]+/(?:[^/?#]+/)?(?P<episode_id>[^/?#]+-(?P<id>[0-9a-f]{32})) |
            shorts/[^/?#]+-(?P<short_id>[0-9a-f]{32})
        )
    '''

    _TESTS = [{
        'url': 'https://www.mxplayer.in/show/watch-my-girlfriend-is-an-alien/season-1/episode-1-online-9d2013d31d5835bb8400e3b3c5e7bb72',
        'info_dict': {
            'id': '9d2013d31d5835bb8400e3b3c5e7bb72',
            'ext': 'mp4',
            'title': 'Episode 1',
        },
        'params': {
            'skip_download': True,
        },
    }]

    def _real_extract(self, url):
        """
        Main extraction method called by yt-dlp when a URL matches _VALID_URL.
        """
        # 1. Parse the video ID from the URL pattern
        match = self._match_valid_url(url)
        video_id = (
            match.group('id')
            or match.group('movie_id')
            or match.group('short_id')
        )

        if not video_id:
            raise ExtractorError('Unable to extract a valid video identifier from URL.', expected=True)

        # 2. Download webpage source
        # In MX Player, initial state data is serialized inside a JavaScript window variable
        webpage = self._download_webpage(url, video_id, note='Downloading webpage and stream state')

        # 3. Extract the title from the page metadata
        title = self._html_search_regex(
            r'<title[^>]*>([^<]+)</title>',
            webpage,
            'title',
            default=f'MX Player Video {video_id}'
        )
        title = clean_html(title)

        # 4. Search for the JSON state containing stream information
        mxs_data = self._search_json(
            r'window\.__mxs__\s*=',
            webpage,
            'MX Player state data',
            video_id,
            default=None
        )

        formats = []
        subtitles = {}

        # 5. Define HTTP headers required by CDN servers to authorize streaming
        custom_headers = {
            'Referer': 'https://www.mxplayer.in/',
            'Origin': 'https://www.mxplayer.in',
            'User-Agent': (
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ),
        }

        # 6. Parse manifests if state JSON is available
        if mxs_data and isinstance(mxs_data, dict):
            entities = mxs_data.get('entities', {}).get(video_id, {})
            stream_info = entities.get('stream', {})

            # Check if content is protected by DRM (Widevine/FairPlay)
            if stream_info.get('drmProtect'):
                self.report_drm(video_id)

            # Retrieve stream manifest URLs (HLS / DASH)
            hls_info = stream_info.get('hls', {})
            hls_url = url_or_none(hls_info.get('high') or hls_info.get('main'))

            if hls_url:
                fmts, subs = self._extract_m3u8_formats_and_subtitles(
                    hls_url,
                    video_id,
                    ext='mp4',
                    entry_protocol='m3u8_native',
                    m3u8_id='hls',
                    fatal=False,
                    headers=custom_headers
                )
                formats.extend(fmts)
                self._merge_subtitles(subs, target=subtitles)

        # 7. Fallback: search directly in the webpage HTML for .m3u8 or .mpd links
        if not formats:
            direct_m3u8 = self._html_search_regex(
                r'["\'](https?://[^"\']+\.m3u8(?:\?[^"\']*)?)["\']',
                webpage,
                'fallback m3u8 stream',
                default=None
            )
            if direct_m3u8:
                fmts, subs = self._extract_m3u8_formats_and_subtitles(
                    direct_m3u8,
                    video_id,
                    ext='mp4',
                    entry_protocol='m3u8_native',
                    m3u8_id='hls',
                    fatal=False,
                    headers=custom_headers
                )
                formats.extend(fmts)
                self._merge_subtitles(subs, target=subtitles)

        if not formats:
            raise ExtractorError('No playable stream formats were found for this URL.', expected=True)

        return {
            'id': video_id,
            'title': title,
            'formats': formats,
            'subtitles': subtitles,
            'http_headers': custom_headers,
        }
