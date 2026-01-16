import VisualLearn from "./_components/visual_learn";
import {
  getEmbedUrl,
  getThumbnail,
  getTikTokThumbnail,
} from "@/lib/video-utils";
import VIDEOS from "./_components/static-data";

const AprendePage = async () => {
  const enrichedVideos = await Promise.all(
    VIDEOS.map(async (video) => {
      let thumbnail =
        video.thumbnail || getThumbnail(video.video_id, video.platform);

      // Si es TikTok y no tiene thumbnail custom, intentar obtenerlo
      if (video.platform === "tiktok" && !video.thumbnail) {
        thumbnail = await getTikTokThumbnail(video.video_id);
      }

      return {
        ...video,
        embed_url: getEmbedUrl(video.video_id, video.platform),
        thumbnail,
      };
    }),
  );

  return <VisualLearn videos={enrichedVideos} />;
};

export default AprendePage;
