export function checkApiStatus(req, res) {
  res.status(200).json({
    ok: true,
    uptimeSec: Math.floor(process.uptime()),
  });
}
