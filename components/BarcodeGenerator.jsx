"use client";

import React from "react";
import JsBarcode from 'jsbarcode';
import { AnimatePresence, motion } from "framer-motion";
import { Switch } from "./Switch"; 
import { ThemeToggle } from "./ThemeToggle";
import { MdContentCopy, MdDownload } from "react-icons/md";
import { generateBarcodeFromName } from "@/utils/generateBarcodeFromName"; 

export const BarcodeGenerator = () => {
    const [isNumeroDeBarra, setNumeroDeBarra] = React.useState(false);
    const [nombreProducto, setNombreProducto] = React.useState("");
    const barcodeRef = React.useRef(null);
    const [nuevoCodigoBarra, setNuevoCodigoBarra] = React.useState("");
    const [warningMessage, setWarningMessage] = React.useState("");
    const [isCopied, setCopied] = React.useState(false);
    const [isImageCopied, setIsImageCopied] = React.useState(false);
    const [imageActionMessage, setImageActionMessage] = React.useState("");
    const [isBusyImageAction, setIsBusyImageAction] = React.useState(false);

    React.useEffect(() => {
        if (!barcodeRef.current) return;

        if (!nuevoCodigoBarra) {
            barcodeRef.current.innerHTML = "";
            return;
        }

        // Re-render cleanly on changes (prevents stacking when theme changes).
        barcodeRef.current.innerHTML = "";

        JsBarcode(barcodeRef.current, nuevoCodigoBarra, {
            format: "CODE128",
            lineColor: "#000",
            width: 2,
            height: 40,
            displayValue: true,
        });
    }, [nuevoCodigoBarra]);

    React.useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => {
                setCopied(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    React.useEffect(() => {
        if (!imageActionMessage && !isImageCopied) return;

        const timer = setTimeout(() => {
            setImageActionMessage("");
            setIsImageCopied(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, [imageActionMessage, isImageCopied]);

    const onGenerateBarcode = (e) => {
        e.preventDefault();

        const value = nombreProducto.trim();
        if (!isNumeroDeBarra) {
            if (value !== "") {
                setWarningMessage("");
                setNuevoCodigoBarra(generateBarcodeFromName(value));
            } else {
                setWarningMessage("Debes ingresar el nombre del producto para generar su codigo de barra");
            }
        } else {
            if (value === "") {
                setWarningMessage("Debes ingresar el numero del codigo de barra existente");
                return;
            }

            if (!/^\d+$/.test(value)) {
                setWarningMessage("Para Codigo existente, ingresa solo números");
                return;
            }

            setWarningMessage("");
            setNuevoCodigoBarra(value);
        }
    };

    const copiarAlPortapapeles = (nuevoCodigoBarra) => {
        navigator.clipboard.writeText(nuevoCodigoBarra)
            .then(() => {
                setCopied(true);
            })
            .catch((err) => {
                setCopied(false);
            });
    };

    const getBarcodeSvgDimensions = React.useCallback(() => {
        const svgEl = barcodeRef.current;
        if (!svgEl) return { width: 0, height: 0 };

        // Prefer viewBox as it is usually set by libraries like JsBarcode.
        const viewBox = svgEl.viewBox?.baseVal;
        let width = viewBox?.width ?? 0;
        let height = viewBox?.height ?? 0;

        // Fallback to explicit attributes.
        if (!width && svgEl.width?.baseVal?.value) width = svgEl.width.baseVal.value;
        if (!height && svgEl.height?.baseVal?.value) height = svgEl.height.baseVal.value;

        // Final fallback: measure DOM box.
        if (!width || !height) {
            const rect = svgEl.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
        }

        return { width, height };
    }, []);

    const svgToPngBlob = React.useCallback(async () => {
        const svgEl = barcodeRef.current;
        if (!svgEl) return null;

        const { width, height } = getBarcodeSvgDimensions();
        if (!width || !height) return null;

        // Clone so we can safely enforce namespaces.
        const clone = svgEl.cloneNode(true);
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

        const svgString = new XMLSerializer().serializeToString(clone);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        try {
            const img = new Image();
            img.decoding = "async";

            const load = new Promise((resolve, reject) => {
                img.onload = () => resolve(true);
                img.onerror = () => reject(new Error("No se pudo renderizar el SVG a imagen"));
            });

            img.src = url;
            await load;

            // Make it "photo-like": crisp + white background.
            const ctxScale = 2; // quality boost
            const MAX_DIMENSION = 2000; // avoid huge canvases
            const scale = Math.min(
                ctxScale,
                MAX_DIMENSION / width,
                MAX_DIMENSION / height
            );

            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(width * scale);
            canvas.height = Math.ceil(height * scale);

            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            // White background to match the UI preview.
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.setTransform(scale, 0, 0, scale, 0, 0);
            ctx.drawImage(img, 0, 0, width, height);

            const pngBlob = await new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), "image/png", 1);
            });

            return pngBlob;
        } finally {
            URL.revokeObjectURL(url);
        }
    }, [getBarcodeSvgDimensions]);

    const buildBarcodeFilename = React.useCallback(() => {
        const safe = String(nuevoCodigoBarra ?? "").replace(/[^0-9A-Za-z_-]+/g, "_");
        return `barcode-${safe}.png`;
    }, [nuevoCodigoBarra]);

    const copiarImagenAlPortapapeles = React.useCallback(async () => {
        if (!nuevoCodigoBarra) return;
        setIsBusyImageAction(true);
        setIsImageCopied(false);
        setImageActionMessage("");

        try {
            const pngBlob = await svgToPngBlob();
            if (!pngBlob) {
                setImageActionMessage("No se pudo generar la imagen del código.");
                return;
            }

            // Most modern browsers support writing images via ClipboardItem.
            if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
                setImageActionMessage("Tu navegador no permite copiar imágenes.");
                return;
            }

            const item = new ClipboardItem({ [pngBlob.type || "image/png"]: pngBlob });
            await navigator.clipboard.write([item]);
            setIsImageCopied(true);
            setImageActionMessage("¡Imagen copiada!");
        } catch (e) {
            setImageActionMessage("No se pudo copiar la imagen.");
        } finally {
            setIsBusyImageAction(false);
        }
    }, [nuevoCodigoBarra, svgToPngBlob]);

    const descargarImagen = React.useCallback(async () => {
        if (!nuevoCodigoBarra) return;
        setIsBusyImageAction(true);
        setIsImageCopied(false);
        setImageActionMessage("");

        try {
            const pngBlob = await svgToPngBlob();
            if (!pngBlob) {
                setImageActionMessage("No se pudo generar la imagen del código.");
                return;
            }

            const url = URL.createObjectURL(pngBlob);
            try {
                const a = document.createElement("a");
                a.href = url;
                a.download = buildBarcodeFilename();
                document.body.appendChild(a);
                a.click();
                a.remove();
            } finally {
                URL.revokeObjectURL(url);
            }

            setImageActionMessage("Descarga iniciada.");
        } catch (e) {
            setImageActionMessage("No se pudo descargar la imagen.");
        } finally {
            setIsBusyImageAction(false);
        }
    }, [buildBarcodeFilename, nuevoCodigoBarra, svgToPngBlob]);

    const canGenerate = nombreProducto.trim().length > 0;
    const inputLabel = isNumeroDeBarra ? "Número de código existente" : "Nombre del producto";
    const inputPlaceholder = isNumeroDeBarra ? "Ingresa solo números" : "Ingresa el nombre de tu producto";
    const helperText = isNumeroDeBarra
        ? "Se validará que sea numérico y se generará el CODE128."
        : "Generamos un código CODE128 a partir del nombre (con un identificador).";

    return (
        <form
            onSubmit={e => onGenerateBarcode(e)}
            className="min-h-screen p-6 flex flex-col items-center justify-center gap-6 w-full xl:flex-row xl:items-start xl:gap-10"
        >
            <div className="w-full md:w-120 rounded-2xl border border-(--border) bg-(--surface) p-6">
                <header className="flex items-start justify-between gap-4">
                    <h1 className="font-semibold text-2xl text-left">
                        DAIEGO BarCode Generator
                    </h1>
                    <ThemeToggle />
                </header>

                <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                        <p className="font-light text-xs text-(--muted)">Codigo existente</p>
                        <p className="text-[11px] text-(--muted) mt-1">
                            {isNumeroDeBarra
                                ? "Modo número: valida que sea numérico."
                                : "Modo nombre: genera el código desde el texto."}
                        </p>
                    </div>
                    <Switch
                        width="w-[3.5rem]"
                        height="h-[1.8rem]"
                        activeColor="bg-[var(--accent)]"
                        circleClassName="w-5 h-5"
                        inActiveColor="bg-(--surface-2)"
                        isSwitchTrue={isNumeroDeBarra}
                        setSwitchTrue={() => setNumeroDeBarra(!isNumeroDeBarra)}
                    />
                </div>

                <div className="mt-5 space-y-2">
                    <label htmlFor="nombreProducto" className="text-xs font-light text-(--muted)">
                        {inputLabel}
                    </label>
                    <input
                        type="text"
                        id="nombreProducto"
                        name="nombreProducto"
                        value={nombreProducto}
                        className="border border-(--border) bg-(--surface-2) text-(--input-text) px-3 py-2 rounded-xl w-full placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-(--accent) focus:border-(--accent)"
                        placeholder={inputPlaceholder}
                        onChange={(e) => {
                            setNombreProducto(e.target.value);
                            if (warningMessage) setWarningMessage("");
                        }}
                    />
                    <p className="text-[11px] text-(--muted)">{helperText}</p>

                    <p
                        className="min-h-5 text-sm text-(--danger) font-light"
                        aria-live="polite"
                        role="status"
                    >
                        {warningMessage}
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={!canGenerate}
                    className="mt-4 px-3 py-2 rounded-xl w-full bg-(--btn-bg) border-2 border-(--btn-bg) text-(--btn-text) font-bold duration-300 ease-in-out transition-all hover:bg-(--btn-hover-bg) hover:border-(--btn-hover-bg) hover:text-(--btn-hover-text) focus:outline-none focus:ring-2 focus:ring-(--accent) disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:bg-(--btn-bg) disabled:hover:border-(--btn-bg)"
                >
                    Generar
                </button>
            </div>

            <AnimatePresence mode="wait">
                {nuevoCodigoBarra !== "" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="w-full md:w-120"
                    >
                        <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                            <p className="text-sm font-light text-(--muted)">Nuevo Codigo de Barras Generado</p>

                            <div className="mt-4 rounded-2xl border border-(--border) bg-(--surface-2) px-3 py-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-light text-(--muted)">Codigo</p>
                                        <code className="block mt-1 font-mono text-sm break-all">
                                            {nuevoCodigoBarra}
                                        </code>
                                    </div>
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 border border-(--border) bg-(--surface) hover:bg-(--surface-2) transition-colors"
                                        onClick={() => copiarAlPortapapeles(nuevoCodigoBarra)}
                                    >
                                        <MdContentCopy size={18} />
                                        <span className="text-xs font-medium">Copiar</span>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isCopied && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.18 }}
                                            className="mt-2 text-xs text-(--accent)"
                                        >
                                            ¡Copiado!
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={isBusyImageAction}
                                    onClick={copiarImagenAlPortapapeles}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 border border-(--border) bg-(--surface) hover:bg-(--surface-2) transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                                >
                                    <MdContentCopy size={18} />
                                    <span className="text-xs font-medium">Copiar imagen</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isBusyImageAction}
                                    onClick={descargarImagen}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 border border-(--border) bg-(--accent) hover:bg-(--accent-hover) transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                                >
                                    <MdDownload size={18} className="text-white" />
                                    <span className="text-xs font-medium text-white">Descargar</span>
                                </button>
                            </div>

                            <AnimatePresence>
                                {(isImageCopied || imageActionMessage) && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        transition={{ duration: 0.18 }}
                                        className={`mt-2 text-xs ${isImageCopied ? "text-(--accent)" : "text-(--muted)"}`}
                                        aria-live="polite"
                                        role="status"
                                    >
                                        {imageActionMessage || (isImageCopied ? "¡Imagen copiada!" : "")}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <div className="mt-5 rounded-xl bg-white border border-[#e5e7eb] p-4 flex items-center justify-center">
                                <svg ref={barcodeRef}></svg>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
};