"use server"; // 🚨 [매우 중요] 이 코드는 무조건 '서버(뒷단)'에서만 실행하라는 엄격한 명령어입니다.

// 아까 lib 폴더에서 만든 배달 트럭을 불러옵니다.
import { supabase } from "../lib/supabase"; 
import { revalidatePath } from "next/cache";

// 프롬프트를 받아서 창고에 저장하는 배달원 함수입니다.
export async function savePromptToSupabase(content: string) {
  try {
    // 1. 트럭(supabase)에 짐(content)을 실어서 'prompts'라는 수납장(table)으로 보냅니다.
    const { data, error } = await supabase
      .from('prompts') // 우리가 만든 테이블 이름
      .insert([
        { content: content } // 우리가 만든 컬럼(content)에 데이터 넣기
      ]);

    // 2. 만약 창고에서 거절당하면(에러) 이유를 알려줍니다.
    if (error) {
      console.error("저장 실패:", error.message);
      return { success: false, message: error.message };
    }

    // 3. 저장이 성공하면, 화면을 최신 상태로 새로고침(업데이트) 해줍니다.
    // (만약 프롬프트 보여주는 페이지 주소가 '/image' 라면 아래 괄호 안을 '/image'로 바꾸면 됩니다)
    revalidatePath('/'); 

    return { success: true, message: "프롬프트가 창고에 무사히 저장되었습니다!" };

  } catch (err) {
    console.error("알 수 없는 오류:", err);
    return { success: false, message: "서버 오류가 발생했습니다." };
  }
}