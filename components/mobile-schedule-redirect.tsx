'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function MobileScheduleRedirect() {
  const handleDownload = () => {
    // Здесь должна быть логика для перенаправления на страницу скачивания
    window.location.href = "/download-schedule"
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090B] p-4">
      <Card className="w-full max-w-md bg-[#161719] border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center text-gray-100">Внимание</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4 text-gray-300">
            Данная версия расписания была разработана только для настольных компьютеров.
          </p>
          <p className="text-center mb-4 text-gray-300">
            Однако вы можете воспользоваться модернизированной версией расписания, скачав его по кнопке ниже:
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleDownload} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Скачать расписание
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}