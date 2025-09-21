import exifr from 'exifr';

export default async function handler(req, res) {
  try {
    // CORS対応（Difyから直接呼べるようにする）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // URLパラメータから画像のURLを取得
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'missing url parameter ?url=' });

    // 画像をダウンロード
    const r = await fetch(url);
    if (!r.ok) return res.status(400).json({ error: `fetch failed: ${r.status}` });
    const buf = Buffer.from(await r.arrayBuffer());

    // EXIF情報を解析
    const data = await exifr.parse(buf, { tiff: true, ifd0: true, exif: true, xmp: true });

    // 値を抽出（存在しない場合はnullに）
    const exposure =
      data?.ExposureTime ?? data?.exposureTime ?? null;
    const iso =
      data?.ISO ?? data?.ISOSpeedRatings ?? data?.PhotographicSensitivity ?? null;

    return res.status(200).json({
      camera_make: data?.Make ?? null,
      camera_model: data?.Model ?? null,
      lens_model: data?.LensModel ?? null,
      focal_length_mm: data?.FocalLength ?? null,
      fnumber: data?.FNumber ?? data?.fNumber ?? null,
      exposure_time: exposure,
      iso: iso
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
