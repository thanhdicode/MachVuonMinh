import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWorld, tick, timeline } from "./WorldState";
import { crossesEyelet } from "./introInteraction";
import { startTimeline, goToScene, goToFinale } from "./WorldTimeline";
import { sceneCopy } from "../data/copy";
import { LabControls } from "./LabControls";
import { VietnamEvidence } from "./VietnamEvidence";
import { SourceDrawer } from "./SourceDrawer";
import { Scene07Chapter } from "./Scene07Chapter";
import { HistoryBridge } from "./HistoryBridge";
import { Scene02Chapter } from "./Scene02Chapter";
import { HandFinale } from "./HandFinale";
import { GuideProvider } from "../onboarding/GuideProvider";
import { useGuideApi, useGuideControls } from "../onboarding/guideControls";
const WorldCanvas = lazy(() => import("./WorldCanvas"));
const MiniGame = lazy(() => import("../minigame/MiniGame"));
export function Experience() {
  return (
    <GuideProvider>
      <ExperienceBody />
    </GuideProvider>
  );
}
function ExperienceBody() {
  const state = useWorld(),
    eyeletTarget = useRef<HTMLSpanElement>(null),
    dragStart = useRef<{
      pointerId: number;
      start: { x: number; y: number };
      previous: { x: number; y: number };
      distance: number;
    } | null>(null);
  const [drawer, setDrawer] = useState<"menu" | "source" | "history" | "scene02" | null>(
      null,
    ),
    [source, setSource] = useState(0);
  const [miniGameOpen, setMiniGameOpen] = useState(false);
  const closeMiniGame = useCallback(() => setMiniGameOpen(false), []);
  const openSource = (index: number) => {
    setSource(index);
    setDrawer("source");
  };
  const openHistorySource = (index: number) => {
    setSource(index);
    setDrawer("history");
  };
  const openScene02Source = (index: number) => {setSource(index);setDrawer("scene02")};
  const guideApi = useGuideApi();
  useGuideControls("app", {
    openMenu: () => setDrawer("menu"),
    closeDrawer: () => setDrawer(null),
    openSource: (index, mode) =>
      mode === "history" ? openHistorySource(index) : openSource(index),
    drawer: () => drawer,
    openGame: () => setMiniGameOpen(true),
  });
  useEffect(() => {
    if (!miniGameOpen) guideApi?.notifyGame(false);
  }, [miniGameOpen, guideApi]);
  useEffect(startTimeline, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => useWorld.getState().set({ reduced: media.matches });
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.body.classList.toggle("locked", !state.unlocked);
    return () => document.body.classList.remove("locked");
  }, [state.unlocked]);
  const unlock = () => {
    if (!state.unlocked) {
      state.set({ unlocked: true });
      tick(420);
    }
  };
  const resetThreadDrag = (handle: HTMLButtonElement) => {
    dragStart.current = null;
    timeline.dragging = false;
    handle.style.left = "";
    handle.style.top = "";
  };
  const moveThreadDrag = (pointerId: number, x: number, y: number) => {
    const drag = dragStart.current;
    if (!drag || drag.pointerId !== pointerId) return false;
    const point = { x, y }, bounds = eyeletTarget.current?.getBoundingClientRect();
    const crossed = bounds ? crossesEyelet(drag.previous, point, bounds) : false;
    drag.distance = Math.max(drag.distance, Math.hypot(x - drag.start.x, y - drag.start.y));
    drag.previous = point;
    timeline.endpoint = [(x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2];
    return crossed;
  };
  return (
    <main
      className={`experience scene-${state.active} ${state.unlocked ? "unlocked" : ""} ${state.history ? "history-active" : ""} ${state.machine ? "machine-active" : ""} ${state.finale ? "finale-active" : ""}`}
    >
      <Suspense fallback={null}>
        <WorldCanvas suspended={miniGameOpen} />
      </Suspense>
      {!state.worldReady&&<div className="loading-thread" role="status">Đang nối mạch…</div>}
      <div className="paper-grain" />
      <header className="minimal-nav">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goToScene(0);
          }}
        >
          <span className="brand-symbol">m.</span>
          <span>
            MẠCH
            <br />
            VƯƠN MÌNH
          </span>
        </a>
        <div className="nav-end">
          <button
            className="nav-game-trigger final-game-trigger"
            data-guide="finale-game"
            onClick={() =>
              guideApi ? guideApi.openGame() : setMiniGameOpen(true)
            }
          >
            Chơi game
          </button>
          <span>
            {state.history
              ? "01 / H"
              : String(state.active).padStart(2, "0") + " / 08"}
          </span>
          <button
            aria-label="Mở mục lục"
            className="menu-trigger"
            data-guide="menu-trigger"
            onClick={() => setDrawer("menu")}
          >
            ☰
          </button>
        </div>
      </header>
      {state.active === 0 && state.worldReady && (
        <section className="intro-overlay" aria-label="Kích hoạt sợi đỏ">
          <p className="eyebrow intro-label">
            TRIẾT HỌC MÁC–LÊNIN / LLSX & QHSX
          </p>
          {!state.unlocked && (
            <span
              ref={eyeletTarget}
              className="eyelet-target"
              role="img"
              aria-label="Vòng kim loại — đích kéo sợi đỏ"
            />
          )}
          {!state.unlocked ? (
            <>
              <div className="eyelet-label">
                <span>QUAN HỆ / CẤU TRÚC</span>
                <i />
                <span>SỢI ĐỎ / NĂNG LỰC SẢN XUẤT</span>
              </div>
              <button
                className="thread-handle"
                data-guide="intro-thread"
                aria-label="Kéo sợi đỏ qua vòng. Hoặc nhấn Enter để tiếp tục."
                onPointerDown={(e) => {
                  if (!e.isPrimary || e.button !== 0 || dragStart.current) return;
                  e.preventDefault();
                  const point = { x: e.clientX, y: e.clientY };
                  dragStart.current = { pointerId: e.pointerId, start: point, previous: point, distance: 0 };
                  e.currentTarget.setPointerCapture(e.pointerId);
                  timeline.dragging = true;
                  timeline.endpoint = [
                    (e.clientX / innerWidth) * 2 - 1,
                    1 - (e.clientY / innerHeight) * 2,
                  ];
                }}
                onPointerMove={(e) => {
                  if (dragStart.current?.pointerId !== e.pointerId) return;
                  if (moveThreadDrag(e.pointerId, e.clientX, e.clientY)) {
                    resetThreadDrag(e.currentTarget);
                    unlock();
                    return;
                  }
                  e.currentTarget.style.left = e.clientX + "px";
                  e.currentTarget.style.top = e.clientY + "px";
                }}
                onPointerCancel={(e) => {
                  if (dragStart.current?.pointerId === e.pointerId) resetThreadDrag(e.currentTarget);
                }}
                onLostPointerCapture={(e) => {
                  if (dragStart.current?.pointerId === e.pointerId) resetThreadDrag(e.currentTarget);
                }}
                onPointerUp={(e) => {
                  const drag = dragStart.current;
                  if (!drag || drag.pointerId !== e.pointerId) return;
                  const crossed = moveThreadDrag(e.pointerId, e.clientX, e.clientY);
                  if (crossed || drag.distance < 12) unlock();
                  resetThreadDrag(e.currentTarget);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    unlock();
                  }
                }}
              >
                <span>↗</span>
              </button>
              <div className="intro-prompt">
                <p>KÉO SỢI ĐỎ QUA VÒNG</p>
                <span>Kéo để kết nối · Chạm hoặc Enter để tiếp tục</span>
              </div>
            </>
          ) : (
            <>
              <div className="ink-reveal" />
              <div className="hero-title">
                <span className="eyebrow">
                  VIỆT NAM / NĂNG LỰC MỚI, QUAN HỆ MỚI
                </span>
                <h1>
                  MẠCH
                  <br />
                  <em>VƯƠN MÌNH</em>
                </h1>
                <p>
                  Điều gì xảy ra khi cách chúng ta sản xuất thay đổi nhanh hơn
                  cách xã hội tổ chức sản xuất?
                </p>
              </div>
              <button
                className="next-cue"
                data-guide="intro-next"
                onClick={() => goToScene(1)}
              >
                CUỘN ĐỂ THEO SỢI ĐỎ <span>↓</span>
              </button>
            </>
          )}
        </section>
      )}
      {!state.history && ![2,7].includes(state.active) && sceneCopy[state.active] && (
        <section
          className={`scene-copy copy-${state.active}`}
          key={state.active}
          data-guide={state.active === 8 ? "finale-thesis" : undefined}
          aria-label={sceneCopy[state.active].code}
        >
          <span className="eyebrow">{sceneCopy[state.active].code}</span>
          <h2>{sceneCopy[state.active].title}</h2>
          {!([4, 8].includes(state.active) && state.beat === 1) && (
            <p>{sceneCopy[state.active].body}</p>
          )}
          <div className="specimen-caption">
            <span className="caption-line" />
            {sceneCopy[state.active].note}
          </div>
        </section>
      )}
      {state.active === 1 && !state.history && (
        <>
          <div
            className="guide-proxy guide-proxy--plough"
            data-guide="agrarian-observation"
            aria-hidden="true"
          />
          <div className="world-annotation annotation-soil">
            <span>VẬT MẪU 01.A</span>
            <strong>Lưỡi cày</strong>
            <p>
              Một giới hạn vật chất.
              <br />
              Một chân trời sản xuất.
            </p>
          </div>
        </>
      )}
      {state.active === 3 && (
        <>
          <div className="automation-control" data-guide="automation-range">
            <label htmlFor="automation">
              MỨC TỰ ĐỘNG HÓA <output>{state.automation}%</output>
            </label>
            <input
              id="automation"
              type="range"
              min="0"
              max="100"
              value={state.automation}
              onChange={(e) =>
                state.set({ automation: Number(e.target.value) })
              }
            />
            <div className="range-ends">
              <span>THAO TÁC</span>
              <span>TRI THỨC</span>
            </div>
          </div>
          <div className="role-nodes" data-guide="automation-roles">
            <span style={{ opacity: 1 - state.automation * 0.007 }}>
              <i
                style={{ transform: `scale(${1 - state.automation * 0.005})` }}
              />
              Thao tác
            </span>
            <span>
              <i
                style={{
                  transform: `scale(${0.6 + state.automation * 0.008})`,
                }}
              />
              Giám sát
            </span>
            <span style={{ opacity: 0.35 + state.automation * 0.0065 }}>
              <i
                style={{
                  transform: `scale(${0.4 + state.automation * 0.012})`,
                }}
              />
              Thiết kế & cải tiến
            </span>
          </div>
        </>
      )}
      {state.active === 4 && (
        <>
          <div
            className="guide-proxy guide-proxy--data"
            data-guide="data-observation"
            aria-hidden="true"
          />
          {state.beat === 1 && (
            <p className="data-question">
              Ai sở hữu? <i /> Ai tổ chức? <i /> Giá trị được phân phối thế nào?
            </p>
          )}
        </>
      )}
      {state.active === 5 && <LabControls />}
      {state.active === 6 && <VietnamEvidence openSource={openSource} />}
      {state.active === 8 && (
        <div className="final-actions">
          <button className="finale-next" type="button" onClick={goToFinale}>ĐIỂM CHẠM CON NGƯỜI × CÔNG NGHỆ <span>↓</span></button>
          {state.beat === 1 && (
            <p>
              Đổi mới công cụ. Đổi mới quan hệ. Để con người cùng vươn mình.
            </p>
          )}
          <div>
            <button data-guide="finale-lab" onClick={() => goToScene(5)}>
              THỬ LẠI LAB <span>↗</span>
            </button>
            <button data-guide="finale-source" onClick={() => openSource(0)}>
              XEM NGUỒN <span>↗</span>
            </button>
          </div>
        </div>
      )}
      {miniGameOpen && (
        <Suspense
          fallback={
            <div className="mini-game-loading" role="status">
              Đang mở hành trình ôn tập…
            </div>
          }
        >
          <MiniGame
            onClose={closeMiniGame}
            guide={guideApi?.gameLink ?? null}
          />
        </Suspense>
      )}
      {drawer && (
        <SourceDrawer
          mode={drawer}
          index={source}
          onClose={() => setDrawer(null)}
          onSource={drawer === "history" ? openHistorySource : drawer === "scene02" || drawer === "menu" && state.active === 2 ? openScene02Source : openSource}
        />
      )}
      <footer className="exhibit-footer">
        <span>
          MLN111 <i /> LỰC LƯỢNG SẢN XUẤT × QUAN HỆ SẢN XUẤT
        </span>
        <span>TRẢI NGHIỆM 03—04 PHÚT</span>
      </footer>
      <div className="journey-before" aria-hidden="true" />
      <HistoryBridge openSource={openHistorySource} />
      <Scene02Chapter onSource={openScene02Source} />
      <div className="journey-flow-before" aria-hidden="true" />
      <Scene07Chapter />
      <div className="journey-flow-after" aria-hidden="true" />
      <HandFinale />
    </main>
  );
}
