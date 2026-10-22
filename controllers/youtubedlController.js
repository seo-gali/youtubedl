const youtubedl = require('youtube-dl-exec');
const path = require('path');
const os = require('os');
const fs = require('fs');

const downloadVideo = (videoUrl) => {
  return new Promise((resolve, reject) => {
    // Shorts URL → watch URL 변환
    if (videoUrl.includes('youtube.com/shorts/')) {
      const id = videoUrl.split('/shorts/')[1].split('?')[0];
      videoUrl = `https://www.youtube.com/watch?v=${id}`;
    }

    const directoryPath = path.join(os.homedir(), 'Desktop');
    const outputTemplate = path.join(directoryPath, '%(title)s.%(ext)s');
    const cookiePath = path.join(__dirname, '../cookies/youtube.txt');

    // 쿠키 파일 존재 확인
    if (!fs.existsSync(cookiePath)) {
      console.warn('⚠️  쿠키 파일이 존재하지 않습니다:', cookiePath);
    }

    const subprocess = youtubedl.exec(videoUrl, {
      format: 'bestvideo+bestaudio/best',
      mergeOutputFormat: 'mp4',
      output: outputTemplate,
      noPart: true,
      windowsFilenames: true,
      cookies: cookiePath,
      referer: 'https://www.youtube.com/',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      geoBypass: true,
      forceIpv4: true,
      ffmpegLocation: 'C:\\ProgramData\\chocolatey\\lib\\ffmpeg\\tools\\ffmpeg\\bin\\ffmpeg.exe',
      // quiet: true, // ⚠️ quiet 옵션 해제
      // noWarnings: true,
      // noProgress: true,
    });

    console.log(`🎬 yt-dlp 실행 PID: ${subprocess.pid}`);
    console.log(`📂 출력 경로: ${outputTemplate}`);

    // ⚡ stderr 출력으로 실제 오류 원인 확인
    subprocess.stderr.on('data', (data) => {
      console.error('🧠 yt-dlp stderr:', data.toString());
    });

    subprocess.stdout.on('data', (data) => {
      console.log('📜 yt-dlp stdout:', data.toString());
    });

    subprocess.on('exit', (code) => {
      console.log(`🚪 yt-dlp 종료 코드: ${code}`);
      if (code !== 0) {
        return reject(new Error(`yt-dlp exited with code ${code}`));
      }

      const files = fs.readdirSync(directoryPath);
      const finalFile = files.find(f => f.endsWith('.mp4'));
      if (!finalFile) {
        return reject(new Error('다운로드된 비디오 파일을 찾을 수 없습니다.'));
      }

      const finalPath = path.join(directoryPath, finalFile);
      console.log(`✅ 다운로드 완료 → ${finalPath}`);
      resolve(finalPath);
    });

    subprocess.on('error', (err) => reject(err));
  });
};

module.exports = { downloadVideo };
